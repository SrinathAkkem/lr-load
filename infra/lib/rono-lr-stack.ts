import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

export class RonoLrStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 1,
    });

    const uploadsBucket = new s3.Bucket(this, "UploadsBucket", {
      bucketName: `rono-lr-uploads-${cdk.Aws.ACCOUNT_ID}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    const dbSecurityGroup = new ec2.SecurityGroup(this, "DbSg", {
      vpc,
      description: "RDS MySQL for Rono LR",
      allowAllOutbound: true,
    });

    const database = new rds.DatabaseInstance(this, "Database", {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MICRO,
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [dbSecurityGroup],
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      databaseName: "rono_lr",
      credentials: rds.Credentials.fromGeneratedSecret("rono"),
      multiAz: false,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });

    const repository = new ecr.Repository(this, "EcrRepo", {
      repositoryName: "rono-lr",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [{ maxImageCount: 10 }],
    });

    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc,
      clusterName: "rono-lr-cluster",
    });

    const logGroup = new logs.LogGroup(this, "AppLogs", {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const taskDef = new ecs.FargateTaskDefinition(this, "TaskDef", {
      memoryLimitMiB: 1024,
      cpu: 512,
    });

    uploadsBucket.grantReadWrite(taskDef.taskRole);

    const container = taskDef.addContainer("App", {
      image: ecs.ContainerImage.fromEcrRepository(repository, "latest"),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: "rono-lr", logGroup }),
      environment: {
        NODE_ENV: "production",
        APP_ENV: "production",
        AWS_REGION: cdk.Stack.of(this).region,
        S3_BUCKET: uploadsBucket.bucketName,
        STORAGE_DRIVER: "s3",
      },
      secrets: {
        DATABASE_URL: ecs.Secret.fromSecretsManager(
          database.secret!,
          "host",
        ),
      },
    });

    container.addPortMappings({ containerPort: 3000 });

    const serviceSecurityGroup = new ec2.SecurityGroup(this, "ServiceSg", {
      vpc,
      allowAllOutbound: true,
    });

    dbSecurityGroup.addIngressRule(
      serviceSecurityGroup,
      ec2.Port.tcp(3306),
      "ECS to RDS",
    );

    const alb = new elbv2.ApplicationLoadBalancer(this, "Alb", {
      vpc,
      internetFacing: true,
    });

    const listener = alb.addListener("HttpListener", { port: 80 });

    const service = new ecs.FargateService(this, "Service", {
      cluster,
      taskDefinition: taskDef,
      serviceName: "rono-lr-service",
      desiredCount: 1,
      securityGroups: [serviceSecurityGroup],
      assignPublicIp: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    listener.addTargets("EcsTarget", {
      port: 3000,
      targets: [service],
      healthCheck: { path: "/api/health", healthyHttpCodes: "200" },
    });

    const scaling = service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 4,
    });
    scaling.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 70,
    });

    new cdk.CfnOutput(this, "AlbDns", { value: alb.loadBalancerDnsName });
    new cdk.CfnOutput(this, "EcrUri", { value: repository.repositoryUri });
    new cdk.CfnOutput(this, "S3Bucket", { value: uploadsBucket.bucketName });
    new cdk.CfnOutput(this, "RdsEndpoint", {
      value: database.instanceEndpoint.hostname,
    });
    new cdk.CfnOutput(this, "DbSecretArn", {
      value: database.secret?.secretArn ?? "",
    });
  }
}
