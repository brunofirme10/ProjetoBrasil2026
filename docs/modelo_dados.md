# Modelo de dados - Analytics da Selecao Brasileira na Copa do Mundo de 2026

## 1. Escopo

Este documento descreve o modelo conceitual e logico inicial do projeto de analytics da Selecao Brasileira na Copa do Mundo de 2026. O modelo organiza dados de partidas e arbitragem obtidos no football-data.org e dados de scout de selecoes e jogadores obtidos da FIFA.

O documento nao representa tabelas ja criadas no Databricks. Tipos, chaves, granularidades e regras poderao ser ajustados durante a implementacao.

## 2. Fontes de dados

| Fonte | Conteudo previsto |
|---|---|
| football-data.org | Partidas, adversarios, datas, fases, grupos, placares e arbitragem. |
| FIFA | Estatisticas de scout de selecoes e jogadores. |

## 3. Convencoes de nomenclatura

- Todos os nomes de tabelas e colunas definidos pelo projeto devem estar em portugues.
- Deve ser usado `snake_case`, com letras minusculas e palavras separadas por sublinhado.
- As tabelas devem receber o prefixo da camada: `bronze_`, `prata_` ou `ouro_`.
- Identificadores devem usar o prefixo `id_`.
- Datas devem usar o prefixo `data_` e horas devem explicitar o fuso quando relevante, como em `hora_partida_utc`.
- Percentuais devem usar o sufixo `_pct`.
- Contagens e valores absolutos devem ser nomeados no plural ou de forma que expressem claramente a medida.
- Campos oriundos diretamente das fontes podem preservar os valores originais, mas nao os nomes estrangeiros das colunas do modelo.
- Valores ausentes devem ser representados como nulos, sem substituicao automatica por zero ou texto vazio.

## 4. Camadas de dados

### Bronze

A camada Bronze preserva os registros recebidos das fontes com o menor nivel possivel de transformacao. Sua finalidade e permitir auditoria, reprocessamento e evolucao dos parsers. Cada registro deve manter os dados relevantes extraidos e o conteudo original em `json_bruto`.

### Prata

A camada Prata contem dados limpos, tipados, deduplicados e padronizados. Ela harmoniza nomes e metricas das diferentes fontes e introduz atributos analiticos relacionados ao Brasil. Os dados devem manter granularidade suficiente para reutilizacao em diferentes analises.

### Ouro

A camada Ouro contem agregacoes e indicadores prontos para consumo por dashboards, relatorios e API. Suas tabelas sao orientadas a casos de uso, com regras de calculo documentadas e resultados reproduziveis a partir da camada Prata.

## 5. Modelo logico - Camada Bronze

### `bronze_partidas_2026`

**Objetivo:** armazenar o JSON bruto das partidas da Copa do Mundo de 2026 obtido no football-data.org.

**Granularidade:** um registro por partida retornada pela fonte e por extracao.

**Chave logica:** `id_partida_origem` e `data_extracao`.

| Campo | Tipo logico sugerido | Descricao |
|---|---|---|
| `id_partida_origem` | inteiro longo | Identificador da partida no football-data.org. |
| `data_hora_utc` | data e hora | Data e hora de inicio da partida em UTC. |
| `status_partida` | texto | Estado da partida informado pela fonte. |
| `fase_competicao` | texto | Fase da competicao. |
| `rodada` | texto | Rodada informada pela fonte. |
| `grupo` | texto | Grupo da primeira fase, quando aplicavel. |
| `id_selecao_mandante` | inteiro longo | Identificador da selecao mandante na fonte. |
| `selecao_mandante` | texto | Nome da selecao mandante. |
| `sigla_mandante` | texto | Sigla da selecao mandante. |
| `id_selecao_visitante` | inteiro longo | Identificador da selecao visitante na fonte. |
| `selecao_visitante` | texto | Nome da selecao visitante. |
| `sigla_visitante` | texto | Sigla da selecao visitante. |
| `gols_mandante` | inteiro | Total de gols da selecao mandante. |
| `gols_visitante` | inteiro | Total de gols da selecao visitante. |
| `gols_primeiro_tempo_mandante` | inteiro | Gols da selecao mandante no primeiro tempo. |
| `gols_primeiro_tempo_visitante` | inteiro | Gols da selecao visitante no primeiro tempo. |
| `vencedor` | texto | Indicacao de vencedor conforme a fonte. |
| `duracao` | texto | Duracao ou periodo de jogo informado pela fonte. |
| `nome_arbitro` | texto | Nome do arbitro principal. |
| `nacionalidade_arbitro` | texto | Nacionalidade do arbitro principal. |
| `data_atualizacao_origem` | data e hora | Momento da ultima atualizacao do registro na fonte. |
| `data_extracao` | data e hora | Momento em que o registro foi extraido. |
| `fonte_dado` | texto | Identificacao da fonte, com valor esperado `football-data.org`. |
| `json_bruto` | texto | Conteudo JSON original da resposta associada ao registro. |

### `bronze_estatisticas_selecao_2026`

**Objetivo:** armazenar os dados brutos de scout das selecoes obtidos da FIFA.

**Granularidade:** um registro por competicao, selecao, categoria, metrica e extracao.

**Chave logica:** `id_competicao_origem`, `id_selecao_origem`, `categoria_estatistica`, `nome_metrica_origem` e `data_extracao`.

| Campo | Tipo logico sugerido | Descricao |
|---|---|---|
| `id_competicao_origem` | texto | Identificador da competicao na FIFA. |
| `categoria_estatistica` | texto | Agrupamento da metrica de scout. |
| `id_selecao_origem` | texto | Identificador da selecao na FIFA. |
| `nome_selecao` | texto | Nome da selecao. |
| `sigla_selecao` | texto | Sigla da selecao. |
| `nome_metrica_origem` | texto | Nome original da metrica na fonte. |
| `valor_metrica` | decimal | Valor da metrica informado pela fonte. |
| `classificacao_ranking` | inteiro | Posicao da selecao no ranking da metrica. |
| `data_extracao` | data e hora | Momento em que o registro foi extraido. |
| `fonte_dado` | texto | Identificacao da fonte, com valor esperado `FIFA`. |
| `json_bruto` | texto | Conteudo JSON original da resposta associada ao registro. |

### `bronze_estatisticas_jogadores_2026`

**Objetivo:** armazenar os dados brutos de scout dos jogadores obtidos da FIFA.

**Granularidade:** um registro por competicao, jogador, selecao, categoria, metrica e extracao.

**Chave logica:** `id_competicao_origem`, `id_jogador_origem`, `id_selecao_origem`, `categoria_estatistica`, `nome_metrica_origem` e `data_extracao`.

| Campo | Tipo logico sugerido | Descricao |
|---|---|---|
| `id_competicao_origem` | texto | Identificador da competicao na FIFA. |
| `id_jogador_origem` | texto | Identificador do jogador na FIFA. |
| `nome_jogador` | texto | Nome do jogador. |
| `id_selecao_origem` | texto | Identificador da selecao do jogador na FIFA. |
| `nome_selecao` | texto | Nome da selecao do jogador. |
| `sigla_selecao` | texto | Sigla da selecao do jogador. |
| `posicao` | texto | Posicao do jogador. |
| `categoria_estatistica` | texto | Agrupamento da metrica de scout. |
| `nome_metrica_origem` | texto | Nome original da metrica na fonte. |
| `valor_metrica` | decimal | Valor da metrica informado pela fonte. |
| `classificacao_ranking` | inteiro | Posicao do jogador no ranking da metrica. |
| `data_extracao` | data e hora | Momento em que o registro foi extraido. |
| `fonte_dado` | texto | Identificacao da fonte, com valor esperado `FIFA`. |
| `json_bruto` | texto | Conteudo JSON original da resposta associada ao registro. |

## 6. Modelo logico - Camada Prata

### `prata_partidas`

**Objetivo:** disponibilizar partidas tratadas e atributos derivados para a analise da campanha brasileira.

**Granularidade:** uma linha por partida da Selecao Brasileira.

**Chave logica:** `id_partida`.

| Campo | Tipo logico sugerido | Descricao |
|---|---|---|
| `id_partida` | inteiro longo | Identificador padronizado da partida. |
| `data_partida` | data | Data da partida em UTC. |
| `hora_partida_utc` | horario | Hora de inicio da partida em UTC. |
| `fase_competicao` | texto | Fase padronizada da competicao. |
| `grupo` | texto | Grupo da primeira fase, quando aplicavel. |
| `selecao_mandante` | texto | Nome padronizado da selecao mandante. |
| `sigla_mandante` | texto | Sigla padronizada da selecao mandante. |
| `selecao_visitante` | texto | Nome padronizado da selecao visitante. |
| `sigla_visitante` | texto | Sigla padronizada da selecao visitante. |
| `gols_mandante` | inteiro | Total de gols da selecao mandante. |
| `gols_visitante` | inteiro | Total de gols da selecao visitante. |
| `gols_primeiro_tempo_mandante` | inteiro | Gols da selecao mandante no primeiro tempo. |
| `gols_primeiro_tempo_visitante` | inteiro | Gols da selecao visitante no primeiro tempo. |
| `resultado_brasil` | texto | Resultado do Brasil: vitoria, empate ou derrota. |
| `adversario_brasil` | texto | Nome da selecao adversaria do Brasil. |
| `gols_brasil` | inteiro | Gols marcados pelo Brasil. |
| `gols_adversario` | inteiro | Gols marcados pelo adversario. |
| `saldo_gols_brasil` | inteiro | Diferenca entre `gols_brasil` e `gols_adversario`. |
| `local_brasil` | texto | Papel do Brasil na partida: mandante ou visitante. |
| `nome_arbitro` | texto | Nome do arbitro principal. |
| `nacionalidade_arbitro` | texto | Nacionalidade do arbitro principal. |
| `data_atualizacao_origem` | data e hora | Momento da ultima atualizacao do registro na origem. |

### `prata_estatisticas_selecao`

**Objetivo:** padronizar as metricas de scout por selecao, preservando unidade, temporada e fonte.

**Granularidade:** uma linha por selecao, temporada e metrica.

**Chave logica:** `id_selecao`, `temporada`, `categoria_estatistica` e `nome_metrica`.

| Campo | Tipo logico sugerido | Descricao |
|---|---|---|
| `id_selecao` | texto | Identificador padronizado da selecao. |
| `nome_selecao` | texto | Nome padronizado da selecao. |
| `sigla_selecao` | texto | Sigla padronizada da selecao. |
| `categoria_estatistica` | texto | Categoria padronizada da metrica. |
| `nome_metrica` | texto | Nome padronizado da metrica. |
| `valor_metrica` | decimal | Valor numerico padronizado da metrica. |
| `unidade_medida` | texto | Unidade do valor, como quantidade, percentual ou minutos. |
| `ranking` | inteiro | Posicao da selecao no ranking da metrica. |
| `temporada` | inteiro | Ano da edicao da Copa do Mundo. |
| `fonte_dado` | texto | Identificacao da fonte do dado. |

### `prata_estatisticas_jogadores`

**Objetivo:** padronizar as metricas de scout por jogador, selecao e temporada.

**Granularidade:** uma linha por jogador, selecao, temporada e metrica.

**Chave logica:** `id_jogador`, `id_selecao`, `temporada`, `categoria_estatistica` e `nome_metrica`.

| Campo | Tipo logico sugerido | Descricao |
|---|---|---|
| `id_jogador` | texto | Identificador padronizado do jogador. |
| `nome_jogador` | texto | Nome padronizado do jogador. |
| `id_selecao` | texto | Identificador padronizado da selecao. |
| `nome_selecao` | texto | Nome padronizado da selecao. |
| `sigla_selecao` | texto | Sigla padronizada da selecao. |
| `posicao` | texto | Posicao padronizada do jogador. |
| `categoria_estatistica` | texto | Categoria padronizada da metrica. |
| `nome_metrica` | texto | Nome padronizado da metrica. |
| `valor_metrica` | decimal | Valor numerico padronizado da metrica. |
| `unidade_medida` | texto | Unidade do valor, como quantidade, percentual ou minutos. |
| `ranking` | inteiro | Posicao do jogador no ranking da metrica. |
| `temporada` | inteiro | Ano da edicao da Copa do Mundo. |
| `fonte_dado` | texto | Identificacao da fonte do dado. |

## 7. Modelo logico - Camada Ouro

### `ouro_resumo_brasil_2026`

**Objetivo:** disponibilizar os principais indicadores da campanha brasileira.

**Granularidade:** uma linha para a campanha do Brasil na Copa do Mundo de 2026.

| Campo | Tipo logico sugerido | Descricao |
|---|---|---|
| `jogos` | inteiro | Total de partidas disputadas. |
| `vitorias` | inteiro | Total de vitorias. |
| `empates` | inteiro | Total de empates. |
| `derrotas` | inteiro | Total de derrotas. |
| `aproveitamento_pct` | decimal | Percentual de pontos conquistados sobre os pontos possiveis. |
| `gols_marcados` | inteiro | Total de gols marcados pelo Brasil. |
| `gols_sofridos` | inteiro | Total de gols sofridos pelo Brasil. |
| `saldo_gols` | inteiro | Diferenca entre gols marcados e sofridos. |
| `gols_por_jogo` | decimal | Media de gols marcados por partida. |
| `gols_sofridos_por_jogo` | decimal | Media de gols sofridos por partida. |
| `clean_sheets` | inteiro | Partidas em que o Brasil nao sofreu gols. |

### `ouro_scout_brasil_2026`

**Objetivo:** disponibilizar metricas agregadas de scout da Selecao Brasileira.

**Granularidade:** uma linha para a campanha do Brasil na Copa do Mundo de 2026.

| Campo | Tipo logico sugerido | Descricao |
|---|---|---|
| `gols_esperados` | decimal | Soma de gols esperados do Brasil. |
| `gols_esperados_por_jogo` | decimal | Media de gols esperados por partida. |
| `finalizacoes` | inteiro | Total de finalizacoes. |
| `finalizacoes_por_jogo` | decimal | Media de finalizacoes por partida. |
| `finalizacoes_no_alvo` | inteiro | Total de finalizacoes no alvo. |
| `finalizacoes_no_alvo_por_jogo` | decimal | Media de finalizacoes no alvo por partida. |
| `precisao_finalizacoes_pct` | decimal | Percentual de finalizacoes que atingiram o alvo. |
| `conversao_finalizacoes_pct` | decimal | Percentual de finalizacoes convertidas em gol. |
| `eficiencia_xg_pct` | decimal | Relacao percentual entre gols marcados e gols esperados. |
| `posse_bola_pct` | decimal | Media ponderada ou simples da posse de bola, conforme a granularidade da fonte. |
| `passes_tentados` | inteiro | Total de passes tentados. |
| `passes_completos` | inteiro | Total de passes completos. |
| `precisao_passes_pct` | decimal | Percentual de passes tentados que foram completados. |
| `escanteios` | inteiro | Total de escanteios. |
| `desarmes` | inteiro | Total de desarmes. |
| `interceptacoes` | inteiro | Total de interceptacoes. |
| `recuperacoes` | inteiro | Total de recuperacoes de bola. |
| `bloqueios` | inteiro | Total de bloqueios. |

### `ouro_desempenho_jogadores_brasil_2026`

**Objetivo:** apresentar o ranking de desempenho dos jogadores brasileiros.

**Granularidade:** uma linha por jogador brasileiro na Copa do Mundo de 2026.

**Chave logica:** `id_jogador`.

| Campo | Tipo logico sugerido | Descricao |
|---|---|---|
| `id_jogador` | texto | Identificador padronizado do jogador. |
| `nome_jogador` | texto | Nome padronizado do jogador. |
| `posicao` | texto | Posicao padronizada do jogador. |
| `gols` | inteiro | Total de gols do jogador. |
| `assistencias` | inteiro | Total de assistencias do jogador. |
| `finalizacoes` | inteiro | Total de finalizacoes do jogador. |
| `finalizacoes_no_alvo` | inteiro | Total de finalizacoes no alvo do jogador. |
| `gols_esperados` | decimal | Soma de gols esperados do jogador. |
| `minutos_jogados` | inteiro | Total de minutos em campo. |
| `participacao_gols` | inteiro | Soma de gols e assistencias do jogador. |
| `ranking_interno` | inteiro | Posicao do jogador segundo a regra de classificacao interna. |

### `ouro_comparativo_brasil_2002_2026`

**Objetivo:** comparar o desempenho das selecoes brasileiras nas Copas do Mundo de 2002 e 2026.

**Granularidade:** uma linha por temporada analisada.

**Chave logica:** `temporada`.

| Campo | Tipo logico sugerido | Descricao |
|---|---|---|
| `temporada` | inteiro | Ano da edicao comparada: 2002 ou 2026. |
| `jogos` | inteiro | Total de partidas disputadas. |
| `vitorias` | inteiro | Total de vitorias. |
| `empates` | inteiro | Total de empates. |
| `derrotas` | inteiro | Total de derrotas. |
| `aproveitamento_pct` | decimal | Percentual de pontos conquistados sobre os pontos possiveis. |
| `gols_marcados` | inteiro | Total de gols marcados pelo Brasil. |
| `gols_sofridos` | inteiro | Total de gols sofridos pelo Brasil. |
| `saldo_gols` | inteiro | Diferenca entre gols marcados e sofridos. |
| `gols_por_jogo` | decimal | Media de gols marcados por partida. |
| `gols_sofridos_por_jogo` | decimal | Media de gols sofridos por partida. |
| `finalizacoes` | inteiro | Total de finalizacoes. |
| `finalizacoes_no_alvo` | inteiro | Total de finalizacoes no alvo. |
| `precisao_finalizacoes_pct` | decimal | Percentual de finalizacoes que atingiram o alvo. |
| `conversao_finalizacoes_pct` | decimal | Percentual de finalizacoes convertidas em gol. |
| `posse_bola_pct` | decimal | Media de posse de bola na temporada. |
| `escanteios` | inteiro | Total de escanteios. |
| `faltas` | inteiro | Total de faltas cometidas. |
| `cartoes` | inteiro | Total de cartoes recebidos, conforme criterio a ser validado. |
| `defesas` | inteiro | Total de defesas realizadas pelos goleiros. |
| `clean_sheets` | inteiro | Partidas em que o Brasil nao sofreu gols. |

## 8. Rastreabilidade da fonte

- Todo registro Bronze deve conter `fonte_dado`, `data_extracao` e `json_bruto`.
- Identificadores de origem devem ser preservados na Bronze para correlacao com a fonte e deduplicacao.
- A passagem da Bronze para a Prata deve ser reproduzivel a partir do registro bruto e de regras de transformacao versionadas durante a implementacao.
- A Prata deve preservar `fonte_dado` nas tabelas de estatisticas. Para partidas, a linhagem deve ser mantida por `id_partida` em correspondencia com `id_partida_origem`.
- Cada indicador Ouro deve ser rastreavel ate os registros Prata que participam do calculo e, por consequencia, ate a respectiva fonte Bronze.
- Quando houver multiplas extracoes do mesmo dado, o criterio inicial e usar o registro mais recente segundo `data_atualizacao_origem` e, na ausencia desse campo, `data_extracao`.

## 9. Regras para metricas calculadas

- Metricas calculadas devem ser produzidas na camada Ouro a partir de campos padronizados da camada Prata.
- Cada formula deve ter denominador, unidade, regra de arredondamento e tratamento de valores nulos documentados antes da implementacao.
- Divisoes com denominador zero devem resultar em nulo, e nao em zero, salvo regra de negocio explicitamente aprovada.
- Percentuais devem ser armazenados na escala de 0 a 100.
- Contagens devem considerar apenas partidas concluidas e registros validos para a metrica.
- Resultados de partidas eliminatorias devem seguir o placar e o criterio oficial definido para classificacao; disputas por penaltis devem ser tratadas separadamente dos gols da partida quando a fonte assim permitir.
- Metricas comparativas entre 2002 e 2026 devem usar definicoes equivalentes. Metricas sem equivalencia comprovada devem permanecer nulas ou ser excluidas da comparacao, sem estimativa implicita.

Formulas iniciais:

| Metrica | Regra inicial |
|---|---|
| `saldo_gols_brasil` | `gols_brasil` menos `gols_adversario`. |
| `aproveitamento_pct` | Pontos conquistados divididos por pontos possiveis, multiplicado por 100; vitoria vale tres pontos e empate vale um ponto. |
| `saldo_gols` | `gols_marcados` menos `gols_sofridos`. |
| `gols_por_jogo` | `gols_marcados` dividido por `jogos`. |
| `gols_sofridos_por_jogo` | `gols_sofridos` dividido por `jogos`. |
| `gols_esperados_por_jogo` | `gols_esperados` dividido por `jogos`. |
| `finalizacoes_por_jogo` | `finalizacoes` dividido por `jogos`. |
| `finalizacoes_no_alvo_por_jogo` | `finalizacoes_no_alvo` dividido por `jogos`. |
| `precisao_finalizacoes_pct` | `finalizacoes_no_alvo` dividido por `finalizacoes`, multiplicado por 100. |
| `conversao_finalizacoes_pct` | `gols_marcados` dividido por `finalizacoes`, multiplicado por 100. |
| `eficiencia_xg_pct` | `gols_marcados` dividido por `gols_esperados`, multiplicado por 100. |
| `precisao_passes_pct` | `passes_completos` dividido por `passes_tentados`, multiplicado por 100. |
| `participacao_gols` | `gols` mais `assistencias`. |
| `clean_sheets` | Contagem de partidas concluidas com zero gols sofridos. |

O criterio de `ranking_interno` sera definido antes da implementacao, incluindo metricas participantes, pesos, desempates e tratamento por posicao. Ate essa definicao, o campo representa apenas um requisito logico.

## 10. Relacionamentos conceituais

- Uma selecao disputa muitas partidas, como mandante ou visitante.
- Uma partida possui duas selecoes e pode possuir um arbitro principal.
- Uma selecao possui muitas metricas de scout por competicao e temporada.
- Um jogador pertence a uma selecao no contexto da competicao e possui muitas metricas de scout.
- As tabelas Ouro resumem ou comparam registros das tabelas Prata, sem substituir o historico detalhado.

## 11. Pontos sujeitos a refinamento

Este modelo podera ser refinado apos a inspecao completa dos schemas reais do football-data.org e da FIFA. A validacao devera confirmar disponibilidade, nomes, tipos, unidades, granularidade, identificadores, paginacao, atualizacao e historico dos campos.

Tambem deverao ser confirmados a fonte e o nivel de comparabilidade dos dados historicos de 2002, especialmente para scout, pois eles podem nao possuir a mesma cobertura ou definicao metodologica dos dados de 2026.
