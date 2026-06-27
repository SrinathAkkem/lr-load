#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { RonoLrStack } from "../lib/rono-lr-stack";

const app = new cdk.App();

new RonoLrStack(app, "RonoLRStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "ap-south-1",
  },
});
