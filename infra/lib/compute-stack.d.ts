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
export declare class ComputeStack extends cdk.Stack {
    readonly instance: ec2.Instance;
    readonly elasticIp: ec2.CfnEIP;
    constructor(scope: Construct, id: string, props: ComputeStackProps);
}
