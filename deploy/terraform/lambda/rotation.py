import json
import boto3
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

secrets_client = boto3.client("secretsmanager")


def lambda_handler(event, context):
    arn = event["SecretId"]
    token = event["ClientRequestToken"]
    step = event["Step"]

    metadata = secrets_client.describe_secret(SecretId=arn)
    if not metadata["RotationEnabled"]:
        raise ValueError("Secret is not enabled for rotation")

    current_version = metadata["VersionIdsToStages"]
    if token not in current_version:
        raise ValueError(
            f"Secret version {token} has no stage for rotation"
        )

    if "AWSCURRENT" in current_version[token]:
        logger.info("Version %s already set as AWSCURRENT for secret %s", token, arn)
        return

    if step == "createSecret":
        _create_secret(arn, token)
    elif step == "setSecret":
        _set_secret(arn, token)
    elif step == "testSecret":
        _test_secret(arn, token)
    elif step == "finishSecret":
        _finish_secret(arn, token)
    else:
        raise ValueError(f"Invalid step {step}")


def _create_secret(arn, token):
    try:
        secrets_client.get_secret_value(
            SecretId=arn, VersionId=token, VersionStage="AWSPENDING"
        )
        logger.info("createSecret: version %s already exists", token)
        return
    except secrets_client.exceptions.ResourceNotFoundException:
        pass

    current = json.loads(
        secrets_client.get_secret_value(SecretId=arn, VersionStage="AWSCURRENT")["SecretString"]
    )

    if "password" in current:
        current["password"] = secrets_client.get_random_password(
            ExcludeCharacters=":/@\"' ",
            PasswordLength=32,
        )["RandomPassword"]

    secrets_client.put_secret_value(
        SecretId=arn,
        ClientRequestToken=token,
        VersionStage="AWSPENDING",
        SecretString=json.dumps(current),
    )
    logger.info("createSecret: created pending version %s", token)


def _set_secret(arn, token):
    logger.info("setSecret: no additional configuration needed for %s", token)


def _test_secret(arn, token):
    secrets_client.get_secret_value(
        SecretId=arn, VersionId=token, VersionStage="AWSPENDING"
    )
    logger.info("testSecret: successfully retrieved pending version %s", token)


def _finish_secret(arn, token):
    metadata = secrets_client.describe_secret(SecretId=arn)
    current_version = None
    for version, stages in metadata["VersionIdsToStages"].items():
        if "AWSCURRENT" in stages:
            current_version = version
            break

    secrets_client.update_secret_version_stage(
        SecretId=arn,
        VersionStage="AWSCURRENT",
        MoveToVersionId=token,
        RemoveFromVersionId=current_version,
    )
    logger.info("finishSecret: moved AWSCURRENT to version %s", token)
