import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
export interface ObservabilityStackProps extends cdk.StackProps {
    instance: ec2.Instance;
    dbInstance: rds.DatabaseInstance;
    alertEmail?: string;
}
export declare class ObservabilityStack extends cdk.Stack {
    readonly alertTopic: sns.Topic;
    constructor(scope: Construct, id: string, props: ObservabilityStackProps);
}
