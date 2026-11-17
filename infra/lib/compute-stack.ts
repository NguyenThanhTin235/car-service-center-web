import * as fs from 'fs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  ec2SecurityGroup: ec2.ISecurityGroup;
  ec2Role: iam.IRole;
  instanceTypeStr: string;
}

export class ComputeStack extends cdk.Stack {
  public readonly instance: ec2.Instance;
  public readonly elasticIp: ec2.CfnEIP;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const userDataScript = fs.readFileSync(
      path.join(__dirname, '../scripts/ec2-userdata.sh'),
      'utf8',
    );

    this.instance = new ec2.Instance(this, 'AppInstance', {
      vpc: props.vpc,
      instanceType: new ec2.InstanceType(props.instanceTypeStr || 't3.small'),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: props.ec2SecurityGroup,
      role: props.ec2Role,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(30, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            encrypted: true,
          }),
        },
      ],
      userData: ec2.UserData.custom(userDataScript),
    });

    cdk.Tags.of(this.instance).add('Project', 'car-service');

    this.elasticIp = new ec2.CfnEIP(this, 'AppElasticIp', {
      domain: 'vpc',
      instanceId: this.instance.instanceId,
    });

    new cdk.CfnOutput(this, 'Ec2InstanceId', {
      value: this.instance.instanceId,
    });
    new cdk.CfnOutput(this, 'Ec2PublicIp', {
      value: this.elasticIp.ref,
    });
  }
}
