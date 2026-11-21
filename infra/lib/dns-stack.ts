import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as ses from 'aws-cdk-lib/aws-ses';
import { Construct } from 'constructs';

export interface DnsStackProps extends cdk.StackProps {
  domainName: string;
  hostedZoneId: string;
  elasticIp: ec2.CfnEIP;
}

export class DnsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id, props);

    const hostedZone = route53.PublicHostedZone.fromPublicHostedZoneAttributes(this, 'HostedZone', {
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

    new ses.EmailIdentity(this, 'SesDomainIdentity', {
      identity: ses.Identity.publicHostedZone(hostedZone),
    });

    new route53.TxtRecord(this, 'SpfRecord', {
      zone: hostedZone,
      values: ['v=spf1 include:amazonses.com ~all'],
      ttl: cdk.Duration.minutes(5),
    });

    new route53.TxtRecord(this, 'DmarcRecord', {
      zone: hostedZone,
      recordName: '_dmarc',
      values: [`v=DMARC1; p=none; rua=mailto:dmarc@${props.domainName}`],
      ttl: cdk.Duration.minutes(5),
    });
  }
}
