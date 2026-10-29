import os
import glob
import re

target_dir = r'd:\TLCN\CAR SERVICE CENTER\src\backend'

for filepath in glob.glob(target_dir + '/**/*.ts', recursive=True):
    if 'node_modules' in filepath or 'dist' in filepath:
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    # Precise replacements
    content = content.replace('ServiceTemplate', 'Service')
    content = content.replace('serviceTemplate', 'service')
    content = content.replace('service_template_id', 'service_id')
    content = content.replace('service_template', 'service')
    content = content.replace('Service Templates', 'Services')
    content = content.replace('Service templates', 'Services')

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
