import openpyxl
import json

wb = openpyxl.load_workbook('creative_traits_framework_full.xlsx')
ws = wb.active

traits = {}
for row in ws.iter_rows(min_row=2, values_only=True):
    if row[0]:
        trait_name = row[0]
        options = [str(row[i]).strip() for i in range(1, len(row)) if row[i] and str(row[i]).strip()]
        traits[trait_name] = options

print(json.dumps(traits, indent=2))
