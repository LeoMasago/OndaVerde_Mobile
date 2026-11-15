# Prompts usados (IA como copiloto)

A IA foi usada como copiloto para estruturar e escrever o app. Este arquivo registra os prompts, e a equipe deve conseguir **explicar cada parte do código** (veja o roteiro de estudo no final).

- **Ferramenta:** Claude Code (Anthropic), no aplicativo desktop.
- **Data:** 14/11/2026.
- **Disciplina:** Mobile Development & IoT.

---

## Prompt 1 — pedido inicial

Enviado junto com a imagem do slide *Mobile Development & IOT* (conceito, objetivo, entregáveis e avaliação).

> Tema: melhor organização das cidades com tecnologia e inovação
>
> Proposta: um sistema de semáforos adaptativos com IA que libera o fluxo de forma inteligente nas grandes metrópoles e abre "ondas verdes" para ambulâncias.
>
> Natureza: projeto demonstrativo, em forma de proposta, todo simulado em software.
>
> ## 1. 🎯 Contexto e problema
>
> Nas grandes metrópoles, a maioria dos semáforos funciona em ciclos fixos: o tempo de verde é o mesmo às 3h da manhã e às 18h. O resultado é congestionamento, desperdício de combustível, mais poluição e, principalmente, ambulâncias presas no trânsito em momentos críticos.
>
> A solução: cada cruzamento passa a "enxergar" o trânsito em tempo real, e uma IA central decide o tempo de cada semáforo, coordenando cruzamentos vizinhos e dando prioridade a veículos de emergência.
>
> Com base nisto, faça um aplicativo mobile, utilizando as tecnologias propostas na imagem anexada. Não fuja do contexto, se tiver dúvidas, me pergunte, mas quero que cumpra com as especificações da imagem em anexo. Para adiantar, o banco de dados pode ser do firebase mesmo como já fiz em outros projetos.

**Resultado:** app Expo (React Native + TypeScript + Expo Router) com 4 abas e telas de detalhe, API mock da central, clima real (Open-Meteo), Firestore com banco local de reserva, motor de simulação dos semáforos e da onda verde, acessibilidade e README.

## Prompt 2 — conferência com o slide

Enviado junto com uma nova imagem do mesmo slide.

> Estamos seguindo com o que foi solicitado?

**Resultado:** a IA comparou cada exigência do slide com o que foi feito e listou o que faltava (Ficha oficial, rubrica, vídeo, repositório no GitHub, integrantes).

## Prompt 3 — Ficha da CitizenTech

Enviado junto com a imagem do slide *A Ficha da CitizenTech*.

> Essa é a ficha

**Resultado:** o início do README foi reescrito com os 9 campos da ficha.

## Prompt 4 — briefing completo

Enviado com o PDF *GS CitizenTech - 3ES Fev - FIAP 2026*.

> (arquivo PDF anexado, sem texto)

**Resultado:** a IA leu o briefing e acrescentou ao README as seis perguntas do briefing, os ODS com as metas, a origem dos dados e este arquivo `prompts.md`.

## Prompt 5 — configurar o Firebase

Enviado com um print do console do Firebase (projeto já criado).

> Criei um projeto no firebase, me ajude a configurar e pegar as variáveis necessárias

**Resultado:** passo a passo para registrar o app Web, criar o Firestore e publicar as regras (`firestore.rules`), e um `.env` com o ID do projeto.

## Prompt 6 — configuração do app Web

O grupo colou o objeto `firebaseConfig` do app Web (a chave web do Firebase não é secreta) e avisou que criou o banco e publicou as regras.

**Resultado:** `.env` preenchido e testes do Firestore pelo app: ler, criar, atualizar, confirmar e apagar ocorrências, e iniciar e encerrar a ambulância.

## Prompt 7 — GitHub e testes

> Sim, no GitHub *(sobre incluir o `.env` no repositório)*
>
> Quero testar antes *(sobre subir o código)*

**Resultado:** o `.env` ficou fora do `.gitignore` e foi dado um roteiro de teste no Expo Go.

## Prompt 8 — vídeo de demonstração

> Notei que precisa criar um vídeo do app rodando de até 3 minutos, você consegue fazer isso, comentando e explicando? Esqueci de comentar os participantes e os RM de cada um *(com os nomes e os RM)*

**Resultado:** integrantes no README e um vídeo de 2 min 46 s gravado a partir da versão web, com painel de texto e legendas.

## Prompt 9 — narração com a voz do apresentador

> Não gostei da voz, achei que ficou muito robotizada *(escolheu gravar a própria voz)*
>
> Apenas eu vou apresentar, faça o roteiro para uma pessoa só
>
> Feito, colei as gravações

**Resultado:** texto das cenas em primeira pessoa, roteiro de gravação e montagem do vídeo final com a voz gravada pelo apresentador.

## Prompt 10 — review e limpeza

> Faça um review de tudo o que você fez... Remova os arquivos que não são necessários

**Resultado:** revisão do projeto, correção de uma contagem regressiva negativa da ambulância no modo ciclo fixo, remoção de código morto e de arquivos de apoio que não são mais necessários.

## Prompt 11 — ajustes finais da entrega

> *(links do vídeo e do repositório)* — "não commite e não faça o push de nada, apenas adicione no README"
>
> Ainda precisamos da pasta video e roteiro em docs? — Pode adicionar no gitignore isso
>
> Faça um último review do projeto

**Resultado:** links e integrantes (nomes e RM) no README, pasta de vídeo e roteiro no `.gitignore` e um último review, que corrigiu as instruções do `.env` no README e testou o projeto a partir de uma cópia limpa.

---

## Roteiro para estudar o código

Cada integrante deve conseguir explicar o projeto inteiro. Uma ordem sugerida de leitura:

1. **`src/domain/`** — tipos (`types.ts`), a rede de 12 cruzamentos e as rotas (`network.ts`) e os tipos de ocorrência (`ocorrencias.ts`).
2. **`src/services/traffic/engine.ts`** — a "IA" simulada: fluxo de carros por horário, divisão do verde, espera média e prioridade de ambulância (`applyPreemption`).
3. **`src/services/traffic/emergency.ts`** — o trajeto da ambulância com e sem onda verde.
4. **`src/services/api/`** — a API mock da central (`trafficApi.ts`) e o clima real (`weatherApi.ts`).
5. **`src/services/db/`** — o banco: `firestoreStore.ts` (Firebase), `localStore.ts` (reserva) e `index.ts` (escolha do banco, ID anônimo do aparelho, dados de exemplo).
6. **`src/state/`** — contextos que ligam tudo: configurações e tema (`SettingsContext`), API (`NetworkContext`) e banco (`DbContext`).
7. **`src/hooks/useTraffic.ts`** — junta simulação, horário, chuva e ambulância no estado ao vivo que as telas usam.
8. **`src/app/`** — as telas (Expo Router) e **`src/components/`** — os componentes reutilizáveis.

Perguntas para treinar a explicação:

- Por que dois cruzamentos mostram o mesmo semáforo em celulares diferentes sem servidor? (funções puras, determinísticas por horário)
- O que muda entre *Ciclo fixo* e *IA adaptativa*? (`planAt` e `cycleFor` no `engine.ts`)
- Como a ambulância aparece em todos os celulares? (documento em `emergencias` com `startedAtMs`)
- O que acontece sem internet ou sem o `.env` do Firebase? (`createStore` escolhe o banco local)
- Que recursos de acessibilidade o app tem e onde estão? (seção 7 do README)

> Quando usarem a IA de novo, acrescentem os novos prompts aqui.
