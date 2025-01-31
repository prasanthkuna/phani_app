#!/bin/bash

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# AWS Configuration
AWS_PROFILE="personal"  # Change this to your AWS profile name
export AWS_DEFAULT_REGION="ap-south-1"

# Check if the AWS profile exists
if ! aws configure list-profiles | grep -q "^${AWS_PROFILE}$"; then
    echo "AWS profile '${AWS_PROFILE}' not found. Let's set it up:"
    
    echo "Enter your AWS Access Key ID:"
    read AWS_ACCESS_KEY_ID
    
    echo "Enter your AWS Secret Access Key:"
    read -s AWS_SECRET_ACCESS_KEY
    
    # Configure AWS CLI with the provided credentials
    aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID" --profile $AWS_PROFILE
    aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY" --profile $AWS_PROFILE
    aws configure set region "ap-south-1" --profile $AWS_PROFILE
    aws configure set output "json" --profile $AWS_PROFILE
    
    echo "AWS profile '${AWS_PROFILE}' configured successfully!"
fi

# Export AWS profile
export AWS_PROFILE

# Variables
INSTANCE_NAME="phani-app"
KEY_NAME="phani-app-key"
INSTANCE_TYPE="t2.micro"
AMI_ID="ami-03f4878755434977f"  # Ubuntu 22.04 LTS AMI ID for ap-south-1 (Mumbai)
SECURITY_GROUP_NAME="phani-app-sg"

# Create key pair
echo "Creating key pair in ap-south-1..."
aws ec2 create-key-pair \
    --key-name $KEY_NAME \
    --query 'KeyMaterial' \
    --output text > $KEY_NAME.pem

chmod 400 $KEY_NAME.pem

# Create security group
echo "Creating security group in ap-south-1..."
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name $SECURITY_GROUP_NAME \
    --description "Security group for Phani App" \
    --query 'GroupId' \
    --output text)

# Add inbound rules
aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
    --group-id $SECURITY_GROUP_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0

# Launch EC2 instance
echo "Launching EC2 instance in ap-south-1..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SECURITY_GROUP_ID \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "EC2 instance created successfully in Mumbai (ap-south-1)!"
echo "Instance ID: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"
echo "Key pair saved as: $KEY_NAME.pem"
echo ""
echo "To connect to your instance:"
echo "ssh -i $KEY_NAME.pem ubuntu@$PUBLIC_IP"
echo ""
echo "Next steps:"
echo "1. Update .env file with the public IP: $PUBLIC_IP"
echo "2. Push your code to GitHub"
echo "3. SSH into the instance and run setup scripts" 