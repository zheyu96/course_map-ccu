import requests
from bs4 import BeautifulSoup
import pandas as pd
import os
import json

# Create directories to store CSV and JSON files
os.makedirs('./data/all_csv', exist_ok=True)
os.makedirs('./data/all_json', exist_ok=True)

base_url = "https://kiki.ccu.edu.tw/~ccmisp06/Course/"
response = requests.get(base_url)
response.encoding = 'utf-8'
soup = BeautifulSoup(response.content, "html.parser")

# Find all links on the page
links = soup.find_all('a', href=True)
all_course_json_data = []

for link in links:
    if link['href'].split('.')[0] == '':
        break
    url = base_url + link['href']
    response = requests.get(url)
    response.encoding = 'utf-8'
    page_soup = BeautifulSoup(response.content, "html.parser")
    
    # Replace <br> and </br> with \n
    for br in page_soup.find_all("br"):
        br.replace_with("\n")
    
    # Find the table in the page
    table = page_soup.find('table')
    if table:
        rows = table.find_all('tr')
        data = []
        headers = []
        for i, row in enumerate(rows):
            cols = row.find_all(['td', 'th'])
            
            # Function to convert text to the appropriate data type while keeping original whitespace
            def convert_type(text):
                try:
                    if '.' in text:
                        return float(text)
                    return int(text)
                except ValueError:
                    return text  # Keep the original formatting

            # Apply the conversion function to each column
            cols = [convert_type(ele.text) for ele in cols]
            if len(cols) > 1:
                if i == 0:
                    headers = cols  # The first row is assumed to be the header
                else:
                    for j in range(len(cols)):
                        if headers[j] != '上課地點' and isinstance(cols[j], str):
                            cols[j] = cols[j].replace('\n', ' ')
                    data.append(cols)
        
        if data:
            # Create a DataFrame
            df = pd.DataFrame(data, columns=headers)
            
            # Save to CSV
            filename = link['href'].split('.')[0]
            csv_filename = os.path.join('./data/all_csv', filename + ".csv")
            df.to_csv(csv_filename, index=False, encoding='utf-8-sig')
            print(f"Saved {csv_filename}")

            # Convert DataFrame to JSON
            json_data = df.to_json(orient='records', force_ascii=False)
            
            # Save JSON data in a JavaScript variable format
            json_filename = filename + ".json.js"
            json_js_filename = os.path.join('./data/all_json', json_filename)
            with open(json_js_filename, 'w', encoding='utf-8') as json_js_file:
                json_js_file.write(f"var data = {json_data};")
            
            print(f"Converted {csv_filename} to {json_js_filename}")

            # Add JSON data to the list
            all_course_json_data.extend(json.loads(json_data))

# Create a DataFrame from all the JSON data
all_courses_df = pd.DataFrame(all_course_json_data)

# Add an index column to the DataFrame
all_courses_df.reset_index(inplace=True)
all_courses_df.rename(columns={'index': 'index'}, inplace=True)

# Convert the DataFrame to JSON
all_course_json = all_courses_df.to_json(orient='records', force_ascii=False)

# Replace "index" with index in the JSON string
all_course_json = all_course_json.replace('"index"', 'index')

# Save the combined JSON data into a single JS file
output_filename = './data/all_course.json.js'
with open(output_filename, 'w', encoding='utf-8-sig') as file:
    file.write(f"var all_course_data = {all_course_json};\n")
    file.write(f"export default all_course_data;")

print(f"Combined all course data into {output_filename}")
print("Finished the task!!!")
