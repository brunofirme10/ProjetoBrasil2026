import json
import urllib.parse
import urllib.request

base = "https://gameday-prod.fifa.mangodev.co.uk/1-0/stories"

query = (
    "(and "
    "resourceStatus==`urn:gd:resourceStatus:active` "
    "_externalId~`urn:gd:story:classification:gcp_attack:"
    "competitionId:285023:(.*):rank_asc:page:1$`"
    ")"
)

parametros = urllib.parse.urlencode(
    {
        "query": query,
        "skip": 0,
        "limit": 1,
        "sort": "tags.name==urn:gd:tag:story:fifa:column_number:asc",
    }
)

url = f"{base}?{parametros}"

requisicao = urllib.request.Request(
    url,
    headers={
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/151.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://www.fifa.com/",
    },
)

with urllib.request.urlopen(requisicao, timeout=30) as resposta:
    dados = json.load(resposta)

print("Itens:", len(dados.get("items", [])))
print("Tem próxima página:", dados.get("anotherPage"))

if dados.get("items"):
    primeiro = dados["items"][0]

    print("Primeiro registro:", primeiro["name"]["eng"])
    print("Jogadores no registro:", len(primeiro.get("actors", [])))