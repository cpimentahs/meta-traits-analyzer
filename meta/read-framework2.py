import openpyxl

wb = openpyxl.load_workbook('creative_traits_framework_full.xlsx')
ws = wb.active

print("First 10 rows:")
for i, row in enumerate(ws.iter_rows(values_only=True), 1):
    print(f"Row {i}: {row}")
    if i >= 10:
        break
