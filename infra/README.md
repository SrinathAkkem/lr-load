# Rono LR — AWS Infrastructure

Low-cost, auto-scaling stack for **ap-south-1 (Mumbai)**.

## Architecture

- **VPC** — 2 AZs, public subnets (ALB) + private subnets (RDS, ECS)
- **RDS MySQL 8** — `db.t4g.micro`, single-AZ for cost (enable Multi-AZ for HA)
- **S3** — `rono-lr-uploads-{env}` for photos, signatures, logos, PDFs
- **CloudFront** — HTTPS CDN in front of ALB; `CDN_URL` for upload public URLs
- **ALB + ECS Fargate** — Next.js container, min 1 / max 4 tasks, CPU target 70%
- **ECR** — container registry
- **Secrets Manager** — `DATABASE_URL`, `AUTH_SECRET`, Twilio keys
- **Route 53 + ACM** — custom domain TLS

## Prerequisites

1. AWS CLI configured (`aws configure`)
2. Node.js 20+
3. Bootstrapped CDK: `npx cdk bootstrap aws://ACCOUNT/ap-south-1`

## Deploy infrastructure

```bash
cd 1/lr-load/infra
npm install
npx cdk deploy --all
```

Outputs include: RDS endpoint, S3 bucket name, ECR repo URI, ALB DNS, CloudFront domain.

## App configuration

Copy [`.env.production.aws.example`](../.env.production.aws.example) and set values from CDK outputs + Twilio.

| Variable | Source |
|----------|--------|
| `DATABASE_URL` | RDS endpoint + Secrets Manager |
| `S3_BUCKET` | CDK output |
| `CDN_URL` | CloudFront domain (https) |
| `TWILIO_*` | Twilio console |
| `APP_ENV` | `production` |

## CI/CD

GitHub Actions workflow [`.github/workflows/deploy-aws.yml`](../../.github/workflows/deploy-aws.yml) builds Docker image, pushes to ECR, runs `prisma migrate deploy`, and rolls ECS.

Required GitHub secrets:

- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`

## Mobile (EAS)

```bash
cd 1/lr-mobile
# Set EXPO_PUBLIC_API_URL to CloudFront URL in eas.json env
eas build --platform android --profile production
eas build --platform ios --profile production
```

### Play Store

1. Create app in Google Play Console
2. Upload AAB from EAS build
3. Complete store listing, privacy policy, content rating
4. Submit for review

### App Store

1. Create app in App Store Connect
2. Upload IPA via EAS Submit or Transporter
3. TestFlight beta, then submit for review

## Estimated monthly cost (low traffic)

| Service | ~USD/mo |
|---------|---------|
| RDS db.t4g.micro | 12–15 |
| ALB | 18 |
| Fargate (1×0.25 vCPU) | 10–15 |
| S3 + CloudFront | 1–5 |
| **Total** | **~45–55** |

Scales with ECS task count and RDS size as user base grows.
