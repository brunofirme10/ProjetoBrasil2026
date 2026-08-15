# ============================================================
# INGESTÃO DE PARTIDAS DA SELEÇÃO BRASILEIRA - COPA 2026
#
# Fonte: football-data.org
# Objetivo:
#   Consultar a API da Copa do Mundo de 2026, filtrar somente
#   as partidas da Seleção Brasileira e salvar o resultado em
#   JSON bruto para posterior ingestão na camada Bronze.
#
# Segurança:
#   O token da API NÃO fica gravado no código.
#   Ele deve ser fornecido pela variável de ambiente:
#   FOOTBALL_DATA_TOKEN
# ============================================================


# Biblioteca padrão para trabalhar com JSON.
import json

# Utilizada para capturar exceções de comunicação HTTP
# que podem ocorrer durante a chamada da API.
import http.client

# Utilizada para ler a variável de ambiente que contém o token.
import os

# Utilizada para escrever mensagens de erro em stderr
# e retornar códigos apropriados de execução.
import sys

# Módulos da biblioteca padrão utilizados para chamadas HTTP
# e tratamento de erros de rede.
import urllib.error
import urllib.request

# Utilizados para registrar a data/hora da extração em UTC.
from datetime import datetime, timezone

# Utilizado para manipular caminhos de arquivos de forma
# independente do sistema operacional.
from pathlib import Path


# ============================================================
# CONFIGURAÇÕES GERAIS
# ============================================================

# Endpoint oficial utilizado para consultar as partidas
# da Copa do Mundo na API football-data.org.
URL_PARTIDAS = (
    "https://api.football-data.org/v4/competitions/WC/matches"
)

# Identificação da origem dos dados.
# Será gravada junto ao arquivo para permitir rastreabilidade.
FONTE_DADO = "football-data.org"

# Nome da variável de ambiente que deverá conter
# o token de autenticação da API.
NOME_VARIAVEL_TOKEN = "FOOTBALL_DATA_TOKEN"

# Tempo máximo, em segundos, que o script aguardará
# uma resposta da API.
TIMEOUT_SEGUNDOS = 30


# ============================================================
# CAMINHOS DO PROJETO
# ============================================================

# __file__ representa o caminho deste próprio script.
#
# Estrutura esperada:
#
# ProjetoBrasil2026/
# └── src/
#     └── ingestao/
#         └── ingerir_partidas_2026.py
#
# parents[2] retorna a raiz do projeto:
# ProjetoBrasil2026/
CAMINHO_PROJETO = Path(__file__).resolve().parents[2]

# Arquivo de saída da ingestão.
#
# A pasta dados/bronze será criada automaticamente
# caso ainda não exista.
CAMINHO_SAIDA = (
    CAMINHO_PROJETO
    / "dados"
    / "bronze"
    / "partidas_2026.json"
)


# ============================================================
# EXCEÇÃO PERSONALIZADA
# ============================================================

class ErroIngestao(Exception):
    """
    Representa erros esperados durante o processo de ingestão.

    Permite diferenciar falhas conhecidas da ingestão
    de erros inesperados do Python.
    """


# ============================================================
# OBTENÇÃO DO TOKEN
# ============================================================

def obter_token() -> str:
    """
    Obtém o token da API por meio da variável de ambiente.

    O token não deve ser armazenado diretamente no código
    ou versionado no GitHub.
    """

    # Busca a variável de ambiente e remove espaços
    # acidentais no início ou no fim.
    token = os.environ.get(
        NOME_VARIAVEL_TOKEN,
        ""
    ).strip()

    # Interrompe a execução caso o token não esteja disponível.
    if not token:
        raise ErroIngestao(
            f"A variavel de ambiente "
            f"{NOME_VARIAVEL_TOKEN} nao foi definida."
        )

    return token


# ============================================================
# CONSULTA À API
# ============================================================

def buscar_resposta_api(token: str) -> dict:
    """
    Consulta o endpoint da Copa do Mundo e retorna
    a resposta convertida para um dicionário Python.
    """

    # Monta a requisição HTTP GET.
    #
    # O token é enviado no header X-Auth-Token,
    # conforme exigido pela football-data.org.
    requisicao = urllib.request.Request(
        URL_PARTIDAS,
        headers={
            "X-Auth-Token": token,
            "Accept": "application/json",
        },
        method="GET",
    )

    # --------------------------------------------------------
    # Executa a chamada HTTP
    # --------------------------------------------------------

    try:
        with urllib.request.urlopen(
            requisicao,
            timeout=TIMEOUT_SEGUNDOS,
        ) as resposta:

            # Lê o corpo bruto da resposta em bytes.
            conteudo = resposta.read()

    # Erros HTTP conhecidos, por exemplo:
    # 401 -> token inválido
    # 403 -> acesso não permitido
    # 404 -> endpoint inexistente
    # 429 -> limite de requisições excedido
    except urllib.error.HTTPError as erro:
        raise ErroIngestao(
            f"Erro HTTP ao consultar {FONTE_DADO}: "
            f"status {erro.code} ({erro.reason})."
        ) from erro

    # Erros de rede, timeout, conexão ou comunicação HTTP.
    except (
        urllib.error.URLError,
        TimeoutError,
        OSError,
        http.client.HTTPException,
    ) as erro:

        motivo = getattr(
            erro,
            "reason",
            erro,
        )

        raise ErroIngestao(
            f"Erro de conexao ao consultar "
            f"{FONTE_DADO}: {motivo}."
        ) from erro

    # --------------------------------------------------------
    # Converte a resposta para JSON
    # --------------------------------------------------------

    try:
        # utf-8-sig também tolera arquivos/respostas
        # com BOM sem quebrar o parser.
        dados = json.loads(
            conteudo.decode("utf-8-sig")
        )

    except (
        UnicodeDecodeError,
        json.JSONDecodeError,
    ) as erro:

        raise ErroIngestao(
            f"A resposta de {FONTE_DADO} "
            f"nao contem um JSON valido em UTF-8."
        ) from erro

    # A API deve retornar um objeto JSON no nível raiz.
    if not isinstance(dados, dict):
        raise ErroIngestao(
            f"A resposta de {FONTE_DADO} "
            f"possui uma estrutura JSON inesperada."
        )

    return dados


# ============================================================
# FILTRO DAS PARTIDAS DO BRASIL
# ============================================================

def filtrar_partidas_brasil(
    dados: dict
) -> list[dict]:
    """
    Filtra a resposta da Copa do Mundo e mantém somente
    partidas em que o Brasil participa como mandante
    ou visitante.
    """

    # A resposta esperada da API deve conter
    # uma lista chamada "matches".
    if "matches" not in dados:
        raise ErroIngestao(
            f"A resposta de {FONTE_DADO} "
            f"nao possui a chave 'matches'."
        )

    partidas = dados["matches"]

    # Validação defensiva para evitar processar
    # uma estrutura inesperada.
    if not isinstance(partidas, list):
        raise ErroIngestao(
            f"A chave 'matches' da resposta de "
            f"{FONTE_DADO} nao contem uma lista."
        )

    # Função auxiliar utilizada para recuperar
    # o nome da seleção mandante ou visitante.
    def nome_selecao(
        partida: dict,
        campo: str,
    ) -> str | None:

        selecao = partida.get(campo)

        return (
            selecao.get("name")
            if isinstance(selecao, dict)
            else None
        )

    # Filtra somente partidas em que Brazil aparece
    # como homeTeam ou awayTeam.
    #
    # O objeto original da partida é preservado integralmente.
    partidas_brasil = [
        partida
        for partida in partidas
        if isinstance(partida, dict)
        and (
            nome_selecao(
                partida,
                "homeTeam",
            ) == "Brazil"
            or nome_selecao(
                partida,
                "awayTeam",
            ) == "Brazil"
        )
    ]

    # Evita gerar silenciosamente um arquivo vazio
    # caso a API mude ou o filtro deixe de funcionar.
    if not partidas_brasil:
        raise ErroIngestao(
            "Nenhuma partida da selecao brasileira "
            "foi encontrada na resposta."
        )

    return partidas_brasil


# ============================================================
# PERSISTÊNCIA DA CAMADA BRONZE LOCAL
# ============================================================

def salvar_partidas(
    partidas: list[dict],
    data_extracao: str,
) -> None:
    """
    Salva as partidas em JSON preservando os registros
    originais e adicionando metadados de rastreabilidade.
    """

    # Estrutura de saída.
    #
    # "partidas" mantém os objetos exatamente como vieram
    # da API, enquanto os demais campos registram informações
    # sobre o processo de ingestão.
    resultado = {
        "fonte_dado": FONTE_DADO,
        "data_extracao": data_extracao,
        "quantidade_registros": len(partidas),
        "partidas": partidas,
    }

    # Cria dados/bronze caso a pasta ainda não exista.
    CAMINHO_SAIDA.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    # Salva o arquivo em UTF-8.
    #
    # ensure_ascii=False mantém caracteres especiais legíveis,
    # como nomes de árbitros e seleções.
    with CAMINHO_SAIDA.open(
        "w",
        encoding="utf-8",
        newline="\n",
    ) as arquivo:

        json.dump(
            resultado,
            arquivo,
            ensure_ascii=False,
            indent=2,
        )

        # Mantém quebra de linha ao final do arquivo,
        # prática conveniente para versionamento e ferramentas CLI.
        arquivo.write("\n")


# ============================================================
# ORQUESTRAÇÃO DA INGESTÃO
# ============================================================

def executar() -> None:
    """
    Executa o fluxo completo da ingestão:

    token
      -> API
      -> filtro Brasil
      -> metadados
      -> arquivo Bronze
    """

    # Recupera a credencial de forma segura.
    token = obter_token()

    # Consulta a API da Copa do Mundo.
    dados = buscar_resposta_api(token)

    # Mantém apenas os jogos da Seleção Brasileira.
    partidas = filtrar_partidas_brasil(dados)

    # Registra o momento exato da extração em UTC.
    #
    # Exemplo:
    # 2026-08-10T01:35:22+00:00
    data_extracao = datetime.now(
        timezone.utc
    ).isoformat(
        timespec="seconds"
    )

    # Persiste a resposta na camada Bronze local.
    salvar_partidas(
        partidas,
        data_extracao,
    )

    # --------------------------------------------------------
    # LOG DE EXECUÇÃO
    # --------------------------------------------------------

    print(f"Fonte: {FONTE_DADO}")

    print(
        "Quantidade de partidas encontradas: "
        f"{len(partidas)}"
    )

    print(
        "Caminho do arquivo salvo: "
        f"{CAMINHO_SAIDA}"
    )

    print(
        "Data/hora da extracao: "
        f"{data_extracao}"
    )


# ============================================================
# TRATAMENTO DA EXECUÇÃO DO SCRIPT
# ============================================================

def main() -> int:
    """
    Controla o código de saída do processo.

    0 = execução concluída com sucesso
    1 = falha durante a ingestão
    """

    try:
        executar()

    # Erros previstos durante API, validação ou ingestão.
    except ErroIngestao as erro:
        print(
            f"Falha na ingestao: {erro}",
            file=sys.stderr,
        )
        return 1

    # Falhas relacionadas à escrita do arquivo local.
    except OSError as erro:
        print(
            "Falha ao salvar o arquivo de saida: "
            f"{erro}",
            file=sys.stderr,
        )
        return 1

    return 0


# ============================================================
# PONTO DE ENTRADA
# ============================================================

# Garante que main() seja executado apenas quando este arquivo
# for chamado diretamente, e não quando for importado por testes
# ou por outros módulos do projeto.
if __name__ == "__main__":
    raise SystemExit(main())