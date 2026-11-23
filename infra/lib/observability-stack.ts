import * as fs from 'fs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface ObservabilityStackProps extends cdk.StackProps {
  instance: ec2.Instance;
  dbInstance: rds.DatabaseInstance;
  alertEmail?: string;
}

export class ObservabilityStack extends cdk.Stack {
  public readonly alertTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: ObservabilityStackProps) {
    super(scope, id, props);

    const logGroupNames = [
      { id: 'StagingAppLogGroup', name: '/car-service/staging/app' },
      { id: 'ProdAppLogGroup', name: '/car-service/prod/app' },
      { id: 'NginxLogGroup', name: '/car-service/nginx' },
    ];

    for (const lg of logGroupNames) {
      new logs.LogGroup(this, lg.id, {
        logGroupName: lg.name,
        retention: logs.RetentionDays.TWO_WEEKS,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
    }

    this.alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: 'car-service-alerts',
      displayName: 'Car Service Center Alerts',
    });

    if (props.alertEmail) {
      this.alertTopic.addSubscription(
        new subscriptions.EmailSubscription(props.alertEmail),
      );
    }

    const snsAction = new cloudwatch_actions.SnsAction(this.alertTopic);

    const ec2CpuAlarm = new cloudwatch.Alarm(this, 'Ec2HighCpuAlarm', {
      alarmDescription: 'EC2 CPU utilization exceeded 80%',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: { InstanceId: props.instance.instanceId },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    ec2CpuAlarm.addAlarmAction(snsAction);

    const ec2StatusAlarm = new cloudwatch.Alarm(this, 'Ec2StatusCheckFailedAlarm', {
      alarmDescription: 'EC2 instance status check failed',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'StatusCheckFailed',
        dimensionsMap: { InstanceId: props.instance.instanceId },
        statistic: 'Maximum',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 1,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });
    ec2StatusAlarm.addAlarmAction(snsAction);

    const rdsCpuAlarm = new cloudwatch.Alarm(this, 'RdsHighCpuAlarm', {
      alarmDescription: 'RDS CPU utilization exceeded 80%',
      metric: props.dbInstance.metricCPUUtilization({
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    rdsCpuAlarm.addAlarmAction(snsAction);

    const rdsStorageAlarm = new cloudwatch.Alarm(this, 'RdsLowStorageAlarm', {
      alarmDescription: 'RDS free storage space dropped below 2GB',
      metric: props.dbInstance.metricFreeStorageSpace({
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 2 * 1024 * 1024 * 1024,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    });
    rdsStorageAlarm.addAlarmAction(snsAction);

    const cwAgentConfig = fs.readFileSync(
      path.join(__dirname, '../scripts/cwagent-config.json'),
      'utf8',
    );

    new ssm.StringParameter(this, 'CwAgentConfigParam', {
      parameterName: '/car-service/cwagent-config',
      stringValue: cwAgentConfig,
      description: 'Amazon CloudWatch Agent configuration for Car Service EC2 host',
    });

    const ec2MemAlarm = new cloudwatch.Alarm(this, 'Ec2HighMemoryAlarm', {
      alarmDescription: 'EC2 memory utilization exceeded 85%',
      metric: new cloudwatch.Metric({
        namespace: 'CarService/EC2',
        metricName: 'mem_used_percent',
        dimensionsMap: { InstanceId: props.instance.instanceId },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 85,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    ec2MemAlarm.addAlarmAction(snsAction);

    const ec2DiskAlarm = new cloudwatch.Alarm(this, 'Ec2HighDiskAlarm', {
      alarmDescription: 'EC2 root disk utilization exceeded 85%',
      metric: new cloudwatch.Metric({
        namespace: 'CarService/EC2',
        metricName: 'disk_used_percent',
        dimensionsMap: { InstanceId: props.instance.instanceId },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 85,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    ec2DiskAlarm.addAlarmAction(snsAction);

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: this.alertTopic.topicArn,
    });
  }
}
