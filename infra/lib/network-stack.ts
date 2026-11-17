import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;
  public readonly ec2SecurityGroup: ec2.ISecurityGroup;
  public readonly rdsSecurityGroup: ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'CarServiceVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    const ec2Sg = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc: this.vpc,
      description: 'Allow HTTP/HTTPS traffic to EC2 app host (no SSH)',
      allowAllOutbound: true,
    });
    ec2Sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP from internet');
    ec2Sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS from internet');
    this.ec2SecurityGroup = ec2Sg;

    const rdsSg = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc: this.vpc,
      description: 'Allow MySQL 3306 only from EC2 security group',
      allowAllOutbound: false,
    });
    rdsSg.addIngressRule(ec2Sg, ec2.Port.tcp(3306), 'Allow MySQL from EC2 host');
    this.rdsSecurityGroup = rdsSg;
  }
}
