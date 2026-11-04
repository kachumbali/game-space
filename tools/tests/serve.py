"""Local browser-test server with room for concurrent music preloads."""
import functools
import http.server
import sys

class TestServer(http.server.ThreadingHTTPServer):
    request_queue_size = 64

handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=sys.argv[1])
with TestServer(('', int(sys.argv[2])), handler) as server:
    server.serve_forever()
