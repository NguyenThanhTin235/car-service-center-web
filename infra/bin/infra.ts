#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { DataStack } from '../lib/data-stack';
import { RegistryAuthStack } from '../lib/registry-auth-stack';
import { ComputeStack } from '../lib/compute-stack';
import { DnsStack } from '../lib/dns-stack';
import { ObservabilityStack } from '../lib/observability-stack';

const app = new cdk.App();

const githubRepo =
  (app.node.tryGetContext('githubRepo') as string | undefined) ||
  'NguyenThanhTin235/car-service-center-web';
const alertEmail = app.node.tryGetContext('alertEmail') as string | undefined;
const instanceType =
  (app.node.tryGetContext('instanceType') as string | undefined) || 't3.small';
const domainName = app.node.tryGetContext('domainName') as string | undefined;
const hostedZoneId = app.node.tryGetContext('hostedZoneId') as string | undefined;

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT || '145443242997',
  region: process.env.CDK_DEFAULT_REGION || 'ap-southeast-1',
};

const networkStack = new NetworkStack(app, 'CarServiceNetworkStack', { env });

const dataStack = new DataStack(app, 'CarServiceDataStack', {
  env,
  vpc: networkStack.vpc,
  rdsSecurityGroup: networkStack.rdsSecurityGroup,
});

const registryAuthStack = new RegistryAuthStack(app, 'CarServiceRegistryAuthStack', {
  env,
  githubRepo,
  assetsBucket: dataStack.assetsBucket,
});

const computeStack = new ComputeStack(app, 'CarServiceComputeStack', {
  env,
  vpc: networkStack.vpc,
  ec2SecurityGroup: networkStack.ec2SecurityGroup,
  ec2Role: registryAuthStack.ec2Role,
  instanceTypeStr: instanceType,
});

if (domainName && hostedZoneId) {
  new DnsStack(app, 'CarServiceDnsStack', {
    env,
    domainName,
    hostedZoneId,
    elasticIp: computeStack.elasticIp,
  });
}

new ObservabilityStack(app, 'CarServiceObservabilityStack', {
  env,
  instance: computeStack.instance,
  dbInstance: dataStack.dbInstance,
  alertEmail,
});
