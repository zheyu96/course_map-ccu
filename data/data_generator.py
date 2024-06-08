import requests
from bs4 import BeautifulSoup
import pandas as pd
import os
import json
import re


os.makedirs('./data/all_csv', exist_ok=True)
os.makedirs('./data/all_json', exist_ok=True)

base_url = "https://kiki.ccu.edu.tw/~ccmisp06/Course/"
response = requests.get(base_url)
response.encoding = 'utf-8'
soup = BeautifulSoup(response.content, "html.parser")


links = soup.find_all('a', href=True)
all_course_json_data = []

for link in links:
    if link['href'].split('.')[0] == '':
        break
    url = base_url + link['href']
    response = requests.get(url)
    response.encoding = 'utf-8'
    page_soup = BeautifulSoup(response.content, "html.parser")

    
    html_content = str(page_soup)
    html_content = re.sub(r'<br\s*/?>', '\n', html_content)
    page_soup = BeautifulSoup(html_content, "html.parser")

    
    table = page_soup.find('table')
    if table:
        rows = table.find_all('tr')
        data = []
        headers = []
        for i, row in enumerate(rows):
            cols = row.find_all(['td', 'th'])
            cols = [ele.text.strip() for ele in cols]
            if len(cols) > 1:
                if i == 0:
                    headers = cols  
                else:
                    data.append(cols)

        if data:
            
            df = pd.DataFrame(data, columns=headers)
            
            
            filename = link['href'].split('.')[0]
            csv_filename = os.path.join('./data/all_csv', filename + ".csv")
            df.to_csv(csv_filename, index=False, encoding='utf-8-sig')
            # print(f"Saved {csv_filename}")

            
            json_data = df.to_json(orient='records', force_ascii=False)
            
            
            json_filename = filename + ".json.js"
            json_js_filename = os.path.join('./data/all_json', json_filename)
            with open(json_js_filename, 'w', encoding='utf-8') as json_js_file:
                json_js_file.write(f"var data = {json_data};")
            
            # print(f"Converted {csv_filename} to {json_js_filename}")

            
            all_course_json_data.extend(json.loads(json_data))


all_course_json_data_with_index = [{'index': i, **item} for i, item in enumerate(all_course_json_data)]


all_course_json = json.dumps(all_course_json_data_with_index, ensure_ascii=False)


all_course_json = all_course_json.replace('"index"', 'index')


output_filename = './data/all_course.json.js'
with open(output_filename, 'w', encoding='utf-8-sig') as file:
    file.write(f"var all_course_data = {all_course_json};\n")
    file.write(f"export default all_course_data;")

# print(f"Combined all course data into {output_filename}")
print("Finished the task!!!")
