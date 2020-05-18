import boto3
s3_client = boto3.client("s3")
rfc4180 = False

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('questionsDatabase')
def lambda_handler(event, context):
    bucket_name = event['Records'][0]['s3']['bucket']['name']
    s3_file_name = event['Records'][0]['s3']['object']['key']
    obj = s3_client.get_object(Bucket=bucket_name,Key=s3_file_name)
    data = obj['Body'].read().decode("utf-8")
    rows = data.split("\n")
    for row in rows:
        row_data = row.split(',')
        
        try:
            table.put_item(
                Item={
                    "questionText":row_data[0],
                    "answerText":row_data[1],
                    "courseid": row_data[2],
                    "date": row_data[3]
                    
                    
                    
                   
                })
        except Exception as e:
            print("end of file")
   
        
   
