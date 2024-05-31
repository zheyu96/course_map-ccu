import pandas as pd

df = pd.read_csv(r"C:\Users\USER\Desktop\secondsemester\final_project\JStest\JStest\csv\all.csv",encoding='utf-8-sig')

df.to_json(r"C:\Users\USER\Desktop\secondsemester\final_project\JStest\JStest\csv\course_table.json",orient='table',force_ascii=0)
