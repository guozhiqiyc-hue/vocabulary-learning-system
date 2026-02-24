import json

# 读取JSON文件
with open(r'D:\XX\WL\学习系统\02_English\词汇\每日词汇\vocabulary-learning-system-v6\七上_system_unique.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 提取第501-550条（索引500-549）
batch = data[500:550]

# 提取phrase字段
phrases = []
for item in batch:
    phrases.append({
        "phrase": item.get("phrase", ""),
        "meaning": "",
        "example": ""
    })

# 输出结果
print(json.dumps(phrases, ensure_ascii=False, indent=2))
