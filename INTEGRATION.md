# TOTP Viewer URL Integration Guide

เอกสารนี้อธิบายวิธีสร้าง URL สำหรับ TOTP Viewer จากระบบภายนอก
โดยไม่ต้องผ่านหน้า `/admin` — generate URL ได้เลยจาก backend หรือ frontend ของเว็บอื่น

---

## หลักการเข้ารหัส

URL format:
```
https://totp-generator-three.vercel.app/#<HASH>
```

`HASH` คือ Base64url ของ string ที่มีรูปแบบ:
```
SECRET|DIGITS|PERIOD
```

### ขั้นตอน

1. นำ `SECRET`, `DIGITS`, `PERIOD` มาต่อกันด้วย `|`
2. เข้ารหัสด้วย Base64 (standard)
3. แปลงให้เป็น Base64url (URL-safe) โดย:
   - แทน `+` ด้วย `-`
   - แทน `/` ด้วย `_`
   - ตัด `=` padding ออก

### ตัวอย่าง

```
Input:  JBSWY3DPEHPK3PXP|6|30
Base64: SkJTV1kzRFBFSFBLM1BYUF82fDMw
Result: SkJTV1kzRFBFSFBLM1BYUF82fDMw  (ไม่มี +/= ในกรณีนี้)

URL: https://totp-generator-three.vercel.app/#SkJTV1kzRFBFSFBLM1BYUF82fDMw
```

---

## Implementation ในแต่ละภาษา

### JavaScript / TypeScript

```ts
function buildTOTPUrl(
  secret: string,
  digits: number = 6,
  period: number = 30,
  baseUrl: string = 'https://totp-generator-three.vercel.app/'
): string {
  const hash = btoa(`${secret}|${digits}|${period}`)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `${baseUrl}#${hash}`
}

// ใช้งาน
const url = buildTOTPUrl('JBSWY3DPEHPK3PXP', 6, 30)
```

---

### Python

```python
import base64

def build_totp_url(
    secret: str,
    digits: int = 6,
    period: int = 30,
    base_url: str = 'https://totp-generator-three.vercel.app/'
) -> str:
    raw = f"{secret}|{digits}|{period}"
    encoded = base64.urlsafe_b64encode(raw.encode()).decode().rstrip('=')
    return f"{base_url}#{encoded}"

# ใช้งาน
url = build_totp_url('JBSWY3DPEHPK3PXP', 6, 30)
```

> หมายเหตุ: `base64.urlsafe_b64encode` ใช้ `-` และ `_` แทน `+` และ `/` อยู่แล้ว

---

### PHP

```php
function buildTOTPUrl(
    string $secret,
    int $digits = 6,
    int $period = 30,
    string $baseUrl = 'https://totp-generator-three.vercel.app/'
): string {
    $raw = "{$secret}|{$digits}|{$period}";
    $hash = rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    return "{$baseUrl}#{$hash}";
}

// ใช้งาน
$url = buildTOTPUrl('JBSWY3DPEHPK3PXP', 6, 30);
```

---

### Go

```go
import (
    "encoding/base64"
    "fmt"
)

func BuildTOTPUrl(secret string, digits, period int, baseUrl string) string {
    raw := fmt.Sprintf("%s|%d|%d", secret, digits, period)
    hash := base64.RawURLEncoding.EncodeToString([]byte(raw))
    return fmt.Sprintf("%s#%s", baseUrl, hash)
}

// ใช้งาน
url := BuildTOTPUrl("JBSWY3DPEHPK3PXP", 6, 30, "https://totp-generator-three.vercel.app/")
```

> `base64.RawURLEncoding` = URL-safe + ไม่มี padding ในตัว

---

### C# / .NET

```csharp
using System;
using System.Text;

string BuildTOTPUrl(string secret, int digits = 6, int period = 30,
    string baseUrl = "https://totp-generator-three.vercel.app/")
{
    var raw = $"{secret}|{digits}|{period}";
    var hash = Convert.ToBase64String(Encoding.UTF8.GetBytes(raw))
        .Replace('+', '-').Replace('/', '_').TrimEnd('=');
    return $"{baseUrl}#{hash}";
}
```

---

## Input Rules

| Parameter | Type   | Required | Default | Notes |
|-----------|--------|----------|---------|-------|
| `secret`  | string | yes      | —       | Base32 encoded, uppercase, no spaces |
| `digits`  | int    | no       | `6`     | 6, 7, หรือ 8 เท่านั้น |
| `period`  | int    | no       | `30`    | หน่วยเป็นวินาที, min 10, max 300 |

### Secret Key format
- ต้องเป็น **Base32** (A-Z, 2-7)
- **Uppercase** เท่านั้น
- **ไม่มี space** หรืออักขระพิเศษ
- ตัวอย่างที่ถูกต้อง: `JBSWY3DPEHPK3PXP`, `NFRZUFU1T0NMQU1G`

---

## Decode (ตรวจสอบย้อนกลับ)

ถ้าต้องการ decode hash กลับมาตรวจสอบ:

```python
import base64

def decode_totp_hash(hash_str: str) -> dict:
    # เติม padding กลับ
    padded = hash_str + '=' * (4 - len(hash_str) % 4)
    raw = base64.urlsafe_b64decode(padded).decode()
    parts = raw.split('|')
    return {
        'secret': parts[0],
        'digits': int(parts[1]) if len(parts) > 1 else 6,
        'period': int(parts[2]) if len(parts) > 2 else 30,
    }
```

---

## Security Notes

- `#hash` ไม่ถูกส่งไป server เลย (browser ไม่ส่ง fragment ใน HTTP request)
- Secret Key จะอยู่ใน URL ที่ client เห็นได้ — ควรแชร์ผ่านช่องทางที่ปลอดภัย
- การ encode เป็น Base64url ไม่ใช่การเข้ารหัส (encryption) — เป็นแค่ obfuscation
- ถ้าต้องการความปลอดภัยสูงขึ้น ควรเพิ่ม symmetric encryption (เช่น AES) ก่อน encode
