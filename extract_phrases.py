import json

# 读取JSON文件
with open('七上_system_unique.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 提取第701-750条（索引700-749）
cards = data['cards'][700:750]

# 输出phrase列表
for card in cards:
    print(card['phrase'])
