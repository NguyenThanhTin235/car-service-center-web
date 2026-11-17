import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
export declare class NetworkStack extends cdk.Stack {
    readonly vpc: ec2.IVpc;
    readonly ec2SecurityGroup: ec2.ISecurityGroup;
    readonly rdsSecurityGroup: ec2.ISecurityGroup;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
