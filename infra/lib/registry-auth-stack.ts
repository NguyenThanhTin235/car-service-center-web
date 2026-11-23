import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface RegistryAuthStackProps extends cdk.StackProps {
  githubRepo: string;
  assetsBucket: s3.IBucket;
}

export class RegistryAuthStack extends cdk.Stack {
  public readonly repositories: {
    backend: ecr.Repository;
    customerWeb: ecr.Repository;
    internalWeb: ecr.Repository;
  };
  public readonly ec2Role: iam.Role;
  public readonly githubDeployRole: iam.Role;

  constructor(scope: Construct, id: string, props: RegistryAuthStackProps) {
    super(scope, id, props);

    const createRepo = (constructId: string, repositoryName: string): ecr.Repository =>
      new ecr.Repository(this, constructId, {
        repositoryName,
        lifecycleRules: [{ maxImageCount: 10 }],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        emptyOnDelete: true,
      });

    this.repositories = {
      backend: createRepo('BackendRepo', 'car-service/backend'),
      customerWeb: createRepo('CustomerWebRepo', 'car-service/customer-web'),
      internalWeb: createRepo('InternalWebRepo', 'car-service/internal-web'),
    };

    const allRepos = [
      this.repositories.backend,
      this.repositories.customerWeb,
      this.repositories.internalWeb,
    ];

    const githubProvider = new iam.OpenIdConnectProvider(this, 'GitHubOidcProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    const [repoOwner, repoName] = props.githubRepo.split('/');

    this.githubDeployRole = new iam.Role(this, 'GitHubDeployRole', {
      roleName: 'car-service-github-deploy-role',
      assumedBy: new iam.FederatedPrincipal(
        githubProvider.openIdConnectProviderArn,
        {
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          },
          StringLike: {
            'token.actions.githubusercontent.com:sub': [
              `repo:${props.githubRepo}:*`,
              `repo:${repoOwner}@*/${repoName}@*:*`,
            ],
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
    });

    for (const repo of allRepos) {
      repo.grantPullPush(this.githubDeployRole);
    }

    this.githubDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ec2:DescribeInstances'],
        resources: ['*'],
      }),
    );

    this.githubDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ssm:SendCommand'],
        resources: [
          `arn:aws:ssm:${this.region}::document/AWS-RunShellScript`,
          `arn:aws:ec2:${this.region}:${this.account}:instance/*`,
        ],
      }),
    );

    this.githubDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetCommandInvocation', 'ssm:ListCommandInvocations'],
        resources: [`arn:aws:ssm:${this.region}:${this.account}:*`],
      }),
    );

    this.githubDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['sns:Publish'],
        resources: [`arn:aws:sns:${this.region}:${this.account}:car-service-alerts`],
      }),
    );

    this.ec2Role = new iam.Role(this, 'Ec2InstanceRole', {
      roleName: 'car-service-ec2-role',
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });

    for (const repo of allRepos) {
      repo.grantPull(this.ec2Role);
    }

    props.assetsBucket.grantReadWrite(this.ec2Role);

    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
      }),
    );

    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParametersByPath', 'ssm:GetParameters', 'ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/car-service`,
          `arn:aws:ssm:${this.region}:${this.account}:parameter/car-service/*`,
        ],
      }),
    );

    new cdk.CfnOutput(this, 'GitHubDeployRoleArn', {
      value: this.githubDeployRole.roleArn,
    });
    new cdk.CfnOutput(this, 'BackendEcrRepoUri', {
      value: this.repositories.backend.repositoryUri,
    });
    new cdk.CfnOutput(this, 'CustomerWebEcrRepoUri', {
      value: this.repositories.customerWeb.repositoryUri,
    });
    new cdk.CfnOutput(this, 'InternalWebEcrRepoUri', {
      value: this.repositories.internalWeb.repositoryUri,
    });
  }
}
