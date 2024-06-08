import json


with open('./data/all_course.json.js', 'r', encoding='utf-8-sig') as file:
    data = file.read()

# 去除 JavaScript 變數分配部分
cleaned_data = data.replace('\ufeffvar all_course_data =', '').strip()
cleaned_data = cleaned_data.replace(';\nexport default all_course_data;','').strip()
# 找到 JSON 陣列的開始位置
json_start = cleaned_data.find('[')
cleaned_data = cleaned_data[json_start:]


courses = json.loads(cleaned_data)


unique_locations = set()
for course in courses:
    location = course.get("上課地點", "")
    
    cleaned_location="";
    for i in location:
        if i>='0' and i<='9':
            break;
        else:
            cleaned_location+=i
    if cleaned_location:
        unique_locations.add(cleaned_location.strip())

 

cleaned_locations = [{"name": loc, "latitude": None, "longitude": None} for loc in unique_locations]


new_json_data = json.dumps(cleaned_locations, ensure_ascii=False, indent=4)


with open('./data/cleaned_locations.json.js', 'w', encoding='utf-8') as file:
    file.write('var cleaned_locations = ')
    file.write(new_json_data)
    file.write(';\nexport default cleaned_locations;')
print('Cleaned locations have been written to cleaned_locations.json.js')