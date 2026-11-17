import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
export interface DnsStackProps extends cdk.StackProps {
    domainName: string;
    hostedZoneId: string;
    elasticIp: ec2.CfnEIP;
}
export declare class DnsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: DnsStackProps);
}
