# Storacha Setup Guide for TrustCircle

## Step 1: Login to Storacha
Run this command and replace `your@email.com` with your actual email:

```bash
w3 login your@email.com
```

You'll receive an email with a verification link. Click it to complete authentication.

## Step 2: Create a Space
```bash
w3 space create TrustCircle
```

## Step 3: Get Your Space DID
```bash
w3 space ls
```

This will show output like:
```
* did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK TrustCircle
```

The `did:key:z6Mkha...` part is your STORACHA_SPACE_DID.

## Step 4: Get Your Principal Key
```bash
w3 whoami
```

This will show your agent information including the DID, which is your STORACHA_PRINCIPAL.

## Step 5: Update .env File
Once you have these values, update the `.env` file in `trustcircle-contracts/` with:

```env
STORACHA_SPACE_DID=did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
STORACHA_PRINCIPAL=your_principal_key_from_whoami
```

## Next Steps
After completing these steps, you'll be ready to deploy the contracts with Filecoin storage support.