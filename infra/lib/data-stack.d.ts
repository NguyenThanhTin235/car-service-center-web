import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
export interface DataStackProps extends cdk.StackProps {
    vpc: ec2.IVpc;
    rdsSecurityGroup: ec2.ISecurityGroup;
}
export declare class DataStack extends cdk.Stack {
    readonly dbInstance: rds.DatabaseInstance;
    readonly dbSecret: secretsmanager.ISecret;
    readonly assetsBucket: s3.Bucket;
    constructor(scope: Construct, id: string, props: DataStackProps);
}
