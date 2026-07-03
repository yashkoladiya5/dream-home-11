# SSL Certificates

## Production
Replace with real Let's Encrypt certificates:
```bash
sudo certbot certonly --webroot -w /var/www/certbot -d dreamhome11.com -d www.dreamhome11.com
```

## Development (self-signed)
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout deploy/nginx/ssl/dreamhome11.key \
  -out deploy/nginx/ssl/dreamhome11.crt \
  -subj "/CN=dreamhome11.com" \
  -addext "subjectAltName=DNS:dreamhome11.com,DNS:localhost"
```
