import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { NetworkStack } from '../lib/network-stack';
import { DataStack } from '../lib/data-stack';
import { RegistryAuthStack } from '../lib/registry-auth-stack';
import { ComputeStack } from '../lib/compute-stack';
import { DnsStack } from '../lib/dns-stack';
import { ObservabilityStack } from '../lib/observability-stack';

const TEST_ENV: cdk.Environment = {
  account: '145443242997',
  region: 'ap-southeast-1',
};

function createAllStacks(options?: { withDns?: boolean; instanceTypeStr?: string }) {
  const app = new cdk.App();

  const networkStack = new NetworkStack(app, 'TestNetworkStack', { env: TEST_ENV });

  const dataStack = new DataStack(app, 'TestDataStack', {
    env: TEST_ENV,
    vpc: networkStack.vpc,
    rdsSecurityGroup: networkStack.rdsSecurityGroup,
  });

  const registryAuthStack = new RegistryAuthStack(app, 'TestRegistryAuthStack', {
    env: TEST_ENV,
    githubRepo: 'NguyenThanhTin235/car-service-center-web',
    assetsBucket: dataStack.assetsBucket,
  });

  const computeStack = new ComputeStack(app, 'TestComputeStack', {
    env: TEST_ENV,
    vpc: networkStack.vpc,
    ec2SecurityGroup: networkStack.ec2SecurityGroup,
    ec2Role: registryAuthStack.ec2Role,
    instanceTypeStr: options?.instanceTypeStr ?? '',
  });

  const dnsStack = options?.withDns
    ? new DnsStack(app, 'TestDnsStack', {
        env: TEST_ENV,
        domainName: 'example.com',
        hostedZoneId: 'Z1234567890ABC',
        elasticIp: computeStack.elasticIp,
      })
    : undefined;

  const observabilityStack = new ObservabilityStack(app, 'TestObservabilityStack', {
    env: TEST_ENV,
    instance: computeStack.instance,
    dbInstance: dataStack.dbInstance,
    alertEmail: 'alerts@example.com',
  });

  return {
    app,
    networkStack,
    dataStack,
    registryAuthStack,
    computeStack,
    dnsStack,
    observabilityStack,
  };
}

describe('Car Service Center CDK Infrastructure', () => {
  it('NetworkStack provisions VPC 10.0.0.0/16 with 0 NAT gateways, HTTP/HTTPS on EC2 SG (no SSH), and 3306-only on RDS SG', () => {
    const { networkStack } = createAllStacks();
    const template = Template.fromStack(networkStack);

    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
    });

    template.resourceCountIs('AWS::EC2::NatGateway', 0);

    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Allow HTTP/HTTPS traffic to EC2 app host (no SSH)',
      SecurityGroupIngress: Match.arrayWith([
        Match.objectLike({
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
          CidrIp: '0.0.0.0/0',
        }),
        Match.objectLike({
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
          CidrIp: '0.0.0.0/0',
        }),
      ]),
    });

    // Ensure no SSH (port 22) ingress rule exists on any security group or ingress resource
    const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
    for (const sg of Object.values(securityGroups)) {
      const ingressRules = (sg.Properties?.SecurityGroupIngress ?? []) as Array<{
        FromPort?: number;
        ToPort?: number;
      }>;
      for (const rule of ingressRules) {
        expect(rule.FromPort).not.toBe(22);
        expect(rule.ToPort).not.toBe(22);
      }
    }

    // Verify RDS security group restricts port 3306 to Ec2SecurityGroup
    const ec2SgLogicalId = Object.keys(securityGroups).find((id) =>
      id.startsWith('Ec2SecurityGroup'),
    );
    const rdsSgLogicalId = Object.keys(securityGroups).find((id) =>
      id.startsWith('RdsSecurityGroup'),
    );
    expect(ec2SgLogicalId).toBeDefined();
    expect(rdsSgLogicalId).toBeDefined();

    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      IpProtocol: 'tcp',
      FromPort: 3306,
      ToPort: 3306,
      GroupId: { 'Fn::GetAtt': [rdsSgLogicalId, 'GroupId'] },
      SourceSecurityGroupId: { 'Fn::GetAtt': [ec2SgLogicalId, 'GroupId'] },
    });
  });

  it('DataStack provisions private db.t4g.micro MySQL RDS and S3 bucket blocking all public access', () => {
    const { dataStack } = createAllStacks();
    const template = Template.fromStack(dataStack);

    template.hasResourceProperties('AWS::RDS::DBInstance', {
      PubliclyAccessible: false,
      DBInstanceClass: 'db.t4g.micro',
      Engine: 'mysql',
    });

    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  it('RegistryAuthStack provisions 3 ECR repositories with LifecyclePolicy and GitHub OIDC IAM Role', () => {
    const { registryAuthStack } = createAllStacks();
    const template = Template.fromStack(registryAuthStack);

    template.resourceCountIs('AWS::ECR::Repository', 3);

    const ecrRepos = template.findResources('AWS::ECR::Repository');
    for (const repo of Object.values(ecrRepos)) {
      expect(repo.Properties?.LifecyclePolicy).toBeDefined();
      expect(repo.Properties?.LifecyclePolicy?.LifecyclePolicyText).toBeTruthy();
    }

    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'car-service-github-deploy-role',
      AssumeRolePolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 'sts:AssumeRoleWithWebIdentity',
            Effect: 'Allow',
            Condition: {
              StringEquals: {
                'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
              },
              StringLike: {
                'token.actions.githubusercontent.com:sub': Match.arrayWith([
                  'repo:NguyenThanhTin235/car-service-center-web:*',
                ]),
              },
            },
          }),
        ]),
      },
    });

    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 'sns:Publish',
            Effect: 'Allow',
          }),
        ]),
      },
    });
  });

  it('ComputeStack defaults EC2 InstanceType to t3.small, creates EIP, and tags Project=car-service', () => {
    const { computeStack } = createAllStacks();
    const template = Template.fromStack(computeStack);

    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't3.small',
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Project',
          Value: 'car-service',
        }),
      ]),
    });

    template.resourceCountIs('AWS::EC2::EIP', 1);
  });

  it('DnsStack creates 6 A records, SES Domain Identity, DKIM CNAMEs, and SPF/DMARC TXT records', () => {
    const { dnsStack } = createAllStacks({ withDns: true });
    expect(dnsStack).toBeDefined();

    const template = Template.fromStack(dnsStack!);
    template.resourceCountIs('AWS::SES::EmailIdentity', 1);
    template.resourceCountIs('AWS::Route53::RecordSet', 11);
  });

  it('ObservabilityStack provisions 3 LogGroups (14-day retention), SSM CWAgent param, 1 SNS Topic, and 6 CloudWatch Alarms', () => {
    const { observabilityStack } = createAllStacks();
    const template = Template.fromStack(observabilityStack);

    template.resourceCountIs('AWS::Logs::LogGroup', 3);
    const logGroups = template.findResources('AWS::Logs::LogGroup');
    for (const lg of Object.values(logGroups)) {
      expect(lg.Properties?.RetentionInDays).toBe(14);
    }

    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/car-service/cwagent-config',
      Type: 'String',
    });

    template.resourceCountIs('AWS::SNS::Topic', 1);
    template.resourceCountIs('AWS::CloudWatch::Alarm', 6);
  });
});
