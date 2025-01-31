bind = "127.0.0.1:8000"
workers = 3
timeout = 120
accesslog = "/var/log/gunicorn/access.log"
errorlog = "/var/log/gunicorn/error.log"
capture_output = True
enable_stdio_inheritance = True 