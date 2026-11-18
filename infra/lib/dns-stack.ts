import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export interface DnsStackProps extends cdk.StackProps {
  domainName: string;
  hostedZoneId: string;
  elasticIp: ec2.CfnEIP;
}

export class DnsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id, props);

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: props.hostedZoneId,
      zoneName: props.domainName,
    });

    const target = route53.RecordTarget.fromIpAddresses(props.elasticIp.ref);
    const subdomains = ['', 'api', 'ops', 'staging', 'staging-api', 'staging-ops'];

    for (const sub of subdomains) {
      const constructId =
        sub === '' ? 'RootARecord' : `${sub.replace(/[^a-zA-Z0-9]/g, '')}ARecord`;

      new route53.ARecord(this, constructId, {
        zone: hostedZone,
        recordName: sub || undefined,
        target,
        ttl: cdk.Duration.seconds(300),
      });
    }
  }
}
