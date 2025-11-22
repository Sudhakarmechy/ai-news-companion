terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-south-1"
}

# Use the existing IAM role you already created in AWS console
data "aws_iam_role" "lambda_role" {
  name = "news-lambda-role"
}

resource "aws_lambda_function" "placeholder_lambda" {
  filename         = "lambda.zip"
  function_name    = "news-placeholder-lambda"
  role             = data.aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"

  source_code_hash = filebase64sha256("lambda.zip")
}
