import re
import json

with open("target_bundle.js", "r", encoding="utf-8") as f:
    js = f.read()

print("File length:", len(js))

# Let's find react components or UI blocks
print("\n--- Active Tab Checks ---")
tabs = set(re.findall(r'activeTab\s*===?\s*["\']([^"\']+)["\']', js))
print("Active tabs:", tabs)

print("\n--- Nav items ---")
nav_items = re.findall(r'\{[^{}]*id:\s*["\']([a-zA-Z0-9_-]+)["\'][^{}]*label:\s*["\']([^"\']+)["\'][^{}]*\}', js)
print("Nav items:", nav_items)

print("\n--- State variables / Form fields ---")
fields = set(re.findall(r'([a-zA-Z0-9_]+)\s*:\s*(?:""|0|false|null)', js))
interesting_fields = [f for f in fields if any(k in f.lower() for k in ["mitra", "transaksi", "nominal", "biaya", "admin", "untung", "pelanggan", "status", "metode", "bank", "invoice", "saldo", "catatan", "rekening", "kas", "tanggal"])]
print("Interesting fields:", interesting_fields)

# Look for modals or dialogs
modals = set(re.findall(r'(?:is[A-Z][a-zA-Z0-9]*ModalOpen|show[A-Z][a-zA-Z0-9]*Modal|modal[A-Z][a-zA-Z0-9]*)', js))
print("Modals found:", modals)
