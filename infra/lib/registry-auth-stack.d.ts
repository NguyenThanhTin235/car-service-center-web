import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
export interface RegistryAuthStackProps extends cdk.StackProps {
    githubRepo: string;
    assetsBucket: s3.IBucket;
}
export declare class RegistryAuthStack extends cdk.Stack {
    readonly repositories: {
        backend: ecr.Repository;
        customerWeb: ecr.Repository;
        internalWeb: ecr.Repository;
    };
    readonly ec2Role: iam.Role;
    readonly githubDeployRole: iam.Role;
    constructor(scope: Construct, id: string, props: RegistryAuthStackProps);
}
