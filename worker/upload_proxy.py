import base64
import hashlib
import hmac
import json
import os
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, quote, urlparse

import httpx

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
PROXY_SECRET = os.environ["PROCESSING_SECRET"].encode()
ALLOWED_BUCKETS = {"recap-assets", "video-originals"}
MAX_CHUNK_BYTES = 7 * 1024 * 1024
TUS_ENDPOINT = f"{SUPABASE_URL}/storage/v1/upload/resumable"


def b64url_encode(value: str) -> str:
    return base64.urlsafe_b64encode(value.encode()).decode().rstrip("=")


def b64url_decode(value: str) -> str:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4)).decode()


def signature(user_id: str, target: str) -> str:
    return hmac.new(PROXY_SECRET, f"{user_id}\n{target}".encode(), hashlib.sha256).hexdigest()


def parse_metadata(value: str) -> dict[str, str]:
    result = {}
    for item in value.split(","):
        key, encoded = item.strip().split(" ", 1)
        result[key] = base64.b64decode(encoded).decode()
    return result


class UploadProxyHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, message, *args):
        print(f"upload-proxy {self.address_string()} {message % args}", flush=True)

    def respond(self, status: int, body: bytes = b"", headers: dict[str, str] | None = None):
        self.send_response(status)
        for key, value in (headers or {}).items():
            self.send_header(key, value)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if body and self.command != "HEAD":
            self.wfile.write(body)

    def authenticate(self) -> str | None:
        authorization = self.headers.get("Authorization", "")
        if not authorization.startswith("Bearer "):
            print("upload-proxy auth rejected: bearer header missing", flush=True)
            self.respond(401, b'{"error":"Missing authorization"}', {"Content-Type": "application/json"})
            return None
        token = authorization.removeprefix("Bearer ").strip()
        token_parts = token.split(".")
        token_metadata = {"segments": len(token_parts), "length": len(token)}
        if len(token_parts) == 3:
            try:
                header = json.loads(base64.urlsafe_b64decode(token_parts[0] + "=" * (-len(token_parts[0]) % 4)))
                payload = json.loads(base64.urlsafe_b64decode(token_parts[1] + "=" * (-len(token_parts[1]) % 4)))
                token_metadata.update({
                    "alg": header.get("alg"),
                    "kid": header.get("kid"),
                    "issuer": payload.get("iss"),
                    "expired": int(payload.get("exp", 0)) <= int(time.time()),
                    "subject_present": bool(payload.get("sub")),
                })
            except Exception:
                token_metadata["decode"] = "failed"
        try:
            response = httpx.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={"Authorization": authorization, "apikey": SERVICE_KEY},
                timeout=15,
            )
            user_id = response.json().get("id") if response.status_code == 200 else None
            if not user_id:
                print(f"upload-proxy auth rejected: upstream_status={response.status_code} token={json.dumps(token_metadata)}", flush=True)
        except Exception as error:
            print(f"upload-proxy auth unavailable: {type(error).__name__} token={json.dumps(token_metadata)}", flush=True)
            user_id = None
        if not user_id:
            self.respond(401, b'{"error":"Invalid session"}', {"Content-Type": "application/json"})
            return None
        return user_id

    def target_for(self, user_id: str) -> str | None:
        query = parse_qs(urlparse(self.path).query)
        encoded_target = query.get("target", [""])[0]
        supplied_signature = query.get("sig", [""])[0]
        try:
            target = b64url_decode(encoded_target)
        except Exception:
            target = ""
        valid_origin = target.startswith(f"{TUS_ENDPOINT}/")
        valid_signature = hmac.compare_digest(supplied_signature, signature(user_id, target))
        if not valid_origin or not valid_signature:
            self.respond(403, b'{"error":"Invalid upload reference"}', {"Content-Type": "application/json"})
            return None
        return target

    def proxy(self):
        user_id = self.authenticate()
        if not user_id:
            return

        content_length = int(self.headers.get("Content-Length", "0") or "0")
        if content_length > MAX_CHUNK_BYTES:
            self.respond(413, b'{"error":"TUS chunk exceeds 7 MB"}', {"Content-Type": "application/json"})
            return

        is_creation = self.command == "POST" and not parse_qs(urlparse(self.path).query).get("target")
        if is_creation:
            try:
                metadata = parse_metadata(self.headers.get("Upload-Metadata", ""))
            except Exception:
                self.respond(400, b'{"error":"Invalid upload metadata"}', {"Content-Type": "application/json"})
                return
            bucket = metadata.get("bucketName", "")
            object_name = metadata.get("objectName", "")
            if bucket not in ALLOWED_BUCKETS or not object_name.startswith(f"{user_id}/"):
                self.respond(403, b'{"error":"Upload must target your own folder"}', {"Content-Type": "application/json"})
                return
            if ".." in object_name or "\\" in object_name:
                self.respond(403, b'{"error":"Invalid object path"}', {"Content-Type": "application/json"})
                return
            target = TUS_ENDPOINT
        else:
            target = self.target_for(user_id)
            if not target:
                return

        body = self.rfile.read(content_length) if content_length else b""
        forwarded_headers = {
            "Authorization": f"Bearer {SERVICE_KEY}",
            "apikey": SERVICE_KEY,
        }
        for header in ("Tus-Resumable", "Upload-Length", "Upload-Offset", "Upload-Metadata", "Content-Type", "x-upsert"):
            value = self.headers.get(header)
            if value:
                forwarded_headers[header] = value
        try:
            response = httpx.request(
                self.command,
                target,
                content=body,
                headers=forwarded_headers,
                timeout=90,
                follow_redirects=False,
            )
        except Exception as error:
            print(f"upload-proxy upstream failure: {type(error).__name__}", flush=True)
            self.respond(502, b'{"error":"Storage is temporarily unavailable"}', {"Content-Type": "application/json"})
            return

        response_headers = {}
        for header in ("Tus-Resumable", "Upload-Offset", "Upload-Length", "Upload-Expires", "Content-Type"):
            value = response.headers.get(header)
            if value:
                response_headers[header] = value
        location = response.headers.get("Location")
        if location:
            encoded = quote(b64url_encode(location), safe="")
            sig = signature(user_id, location)
            response_headers["Location"] = f"/api/uploads/tus?target={encoded}&sig={sig}"
        self.respond(response.status_code, response.content, response_headers)

    do_POST = proxy
    do_PATCH = proxy
    do_HEAD = proxy
    do_DELETE = proxy


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", 8081), UploadProxyHandler)
    print("upload-proxy ready on 8081", flush=True)
    server.serve_forever()
