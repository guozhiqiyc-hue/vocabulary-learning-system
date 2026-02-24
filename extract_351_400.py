import json

with open('七上_system_unique.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Extract items 350-399 (0-indexed, so these are items 351-400)
items = data[350:400]

result = []
for item in items:
    result.append({
        "phrase": item['phrase'],
        "meaning": "",
        "example": ""
    })

# Output as JSON
print(json.dumps(result, ensure_ascii=False, indent=2))
