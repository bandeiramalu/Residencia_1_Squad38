-- ════════════════════════════════════════════════════════════════════════════
--  Portal do Aluno · CEPI Expansão — esquema PostgreSQL (16+)
--
--  Espelha os tipos de src/store/types.ts e o contrato de docs/api/openapi.yaml.
--  Leia docs/BACKEND.md antes: lá estão as regras de negócio que este esquema ajuda a garantir.
--
--  Convenções
--  - Ids são `text`: o front gera ids (ex.: "p1k2x9…") e o servidor aceita, validando formato e dono
--    (ver "IDs gerados no cliente" no BACKEND.md). Seeds usam os ids de src/data ("ana", "prof_ricardo").
--  - Datas em `timestamptz` (a API converte para milissegundos). Dias e semanas são contados no fuso
--    da escola: America/Maceio (Aracaju, UTC−3, sem horário de verão).
--  - Pontos e XP NÃO são editados direto: tudo entra pelo livro-razão `lancamentos`, e um gatilho
--    atualiza o saldo em `perfis_aluno`. O CHECK (pontos >= 0) faz uma compra sem saldo falhar inteira.
--  - Nomes de enums iguais aos do front (inclusive acentos) para a API não precisar traduzir.
--
--  Rodar:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f docs/api/schema.sql
-- ════════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE EXTENSION IF NOT EXISTS btree_gist;   -- impede sessões de estudo sobrepostas (EXCLUDE)

-- ───────────── Tipos enumerados ─────────────

CREATE TYPE papel               AS ENUM ('aluno', 'professor', 'escola');
CREATE TYPE privacidade         AS ENUM ('publico', 'anonimo', 'sombra');
CREATE TYPE disciplina          AS ENUM ('Matemática', 'Biologia', 'História', 'Português', 'Química', 'Física', 'Geografia', 'Inglês');
CREATE TYPE tipo_espaco         AS ENUM ('escola', 'turma', 'clube', 'programa');
CREATE TYPE tipo_post           AS ENUM ('publicacao', 'duvida', 'material', 'aviso');
CREATE TYPE prioridade          AS ENUM ('alta', 'média', 'baixa');
CREATE TYPE decisao_moderacao   AS ENUM ('aprovado', 'removido');
CREATE TYPE tipo_missao         AS ENUM ('diaria', 'professor');
CREATE TYPE status_dia          AS ENUM ('estudou', 'congelado', 'perdido');
CREATE TYPE status_relato       AS ENUM ('em análise', 'validado', 'recusado');
CREATE TYPE aba_loja            AS ENUM ('avatar', 'perfil', 'escola');
CREATE TYPE raridade            AS ENUM ('Comum', 'Incomum', 'Raro', 'Especial', 'Exclusivo');
CREATE TYPE slot_item           AS ENUM ('moldura', 'fundo', 'adesivo', 'efeito', 'animado', 'placa', 'tema', 'capa', 'fonte', 'figurinhas', 'voucher');
CREATE TYPE origem_sessao       AS ENUM ('timer', 'sala', 'manual');
CREATE TYPE tema_sala           AS ENUM ('esmeralda', 'oceano', 'ambar', 'rubi', 'noite');
CREATE TYPE tipo_mensagem_sala  AS ENUM ('mensagem', 'sistema', 'reacao');
CREATE TYPE formato_campeonato  AS ENUM ('mata-mata', 'pontos-corridos', 'interclasses');
CREATE TYPE metrica_campeonato  AS ENUM ('quiz', 'foco', 'xp');
CREATE TYPE status_campeonato   AS ENUM ('inscricoes', 'andamento', 'encerrado');
CREATE TYPE capa_campeonato     AS ENUM ('ouro', 'esmeralda', 'oceano', 'rubi', 'noite');
CREATE TYPE status_partida      AS ENUM ('aguardando', 'disponivel', 'encerrada');
CREATE TYPE tipo_quiz           AS ENUM ('duelo', 'rodada');
CREATE TYPE tipo_atividade      AS ENUM ('lista', 'quiz', 'leitura', 'entrega', 'projeto');
CREATE TYPE status_entrega      AS ENUM ('pendente', 'entregue', 'corrigida');
CREATE TYPE tipo_evento         AS ENUM ('prova', 'trabalho', 'prazo', 'evento');
CREATE TYPE tipo_notificacao    AS ENUM ('pontos', 'atividade', 'correcao', 'entrega', 'campeonato', 'sala', 'moderacao', 'sistema');
CREATE TYPE liga                AS ENUM ('bronze', 'prata', 'ouro', 'diamante');
-- De onde veio cada lançamento de pontos/XP (tabela de valores em docs/BACKEND.md § Regras).
CREATE TYPE origem_lancamento   AS ENUM (
  'estudo', 'ciclo', 'sequencia', 'material', 'resposta', 'resposta_util', 'resposta_oficial',
  'missao', 'coletiva', 'flashcards', 'desafio', 'duelo', 'rodada', 'campeonato',
  'correcao', 'atribuicao', 'relato', 'compra', 'recuperacao_sequencia', 'estorno',
  'saldo_inicial'   -- só no seed/migração: traz o saldo e o XP que já existiam
);

-- ───────────── Escola e pessoas ─────────────

CREATE TABLE turmas (
  id          text PRIMARY KEY CHECK (id ~ '^[a-z0-9-]{1,32}$'),     -- ex.: "9a", "1em"
  nome        text NOT NULL UNIQUE,                                 -- ex.: "9º Ano A" (o nome que o front usa)
  ano_letivo  smallint NOT NULL CHECK (ano_letivo BETWEEN 2020 AND 2100)
);

CREATE TABLE pessoas (
  id             text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 64),
  nome           text NOT NULL CHECK (length(nome) BETWEEN 2 AND 120),
  iniciais       text NOT NULL CHECK (length(iniciais) BETWEEN 1 AND 3),
  papel          papel NOT NULL,
  -- E-mail institucional (@aluno.cepi.edu.br / @cepi.edu.br). Nada de CPF, endereço ou telefone: minimização (LGPD).
  email          text NOT NULL,
  senha_hash     text,                                              -- argon2id/bcrypt; NULL se entrar só por SSO
  turma_id       text REFERENCES turmas (id),                       -- alunos
  disciplina     disciplina,                                        -- professores
  coordenacao    boolean NOT NULL DEFAULT false,
  menor_de_idade boolean NOT NULL DEFAULT true,                     -- LGPD art. 14: exige consentimento do responsável
  -- Perfil editável (PUT /me). `foto` = JPEG recortado ~256 px em dataURL (poucos KB; fica fora do storage de anexos).
  arroba         text CHECK (arroba ~ '^[a-z0-9._]{3,24}$'),
  bio            text CHECK (length(bio) <= 160),
  foto           text CHECK (length(foto) <= 120000 AND (foto IS NULL OR foto LIKE 'data:image/jpeg;base64,%')),
  selos_exibidos text[],                                            -- NULL = todos os selos do CEPI
  ativo          boolean NOT NULL DEFAULT true,
  ultimo_acesso  timestamptz,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  anonimizado_em timestamptz,                                       -- exclusão a pedido/fim de vínculo (ver retenção)
  CHECK (papel <> 'aluno' OR turma_id IS NOT NULL),
  CHECK (papel = 'professor' OR NOT coordenacao OR papel = 'escola')
);
CREATE UNIQUE INDEX pessoas_email_unico ON pessoas (lower(email));
CREATE UNIQUE INDEX pessoas_arroba_unico ON pessoas (lower(arroba)) WHERE arroba IS NOT NULL;   -- 409 ao editar o perfil
CREATE INDEX pessoas_turma ON pessoas (turma_id) WHERE papel = 'aluno';

-- Consentimento do responsável (LGPD art. 14 §1º): uma linha por finalidade.
CREATE TABLE consentimentos (
  id                 bigserial PRIMARY KEY,
  aluno_id           text NOT NULL REFERENCES pessoas (id),
  responsavel_nome   text NOT NULL,
  responsavel_email  text NOT NULL,
  finalidade         text NOT NULL CHECK (finalidade IN ('rede_social', 'ranking_publico', 'notificacoes_email')),
  concedido_em       timestamptz NOT NULL DEFAULT now(),
  revogado_em        timestamptz,
  UNIQUE (aluno_id, finalidade, concedido_em)
);

-- Em quais turmas cada professor leciona (base de "só nas suas turmas").
CREATE TABLE professor_turmas (
  professor_id text NOT NULL REFERENCES pessoas (id),
  turma_id     text NOT NULL REFERENCES turmas (id),
  disciplina   disciplina NOT NULL,
  PRIMARY KEY (professor_id, turma_id, disciplina)
);
CREATE INDEX professor_turmas_turma ON professor_turmas (turma_id);

-- Dados de gamificação do aluno. `pontos` e `xp` são CACHE do livro-razão (só o gatilho escreve).
CREATE TABLE perfis_aluno (
  aluno_id          text PRIMARY KEY REFERENCES pessoas (id) ON DELETE CASCADE,
  pontos            integer NOT NULL DEFAULT 0 CHECK (pontos >= 0),
  xp                integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  privacidade       privacidade NOT NULL DEFAULT 'publico',
  meta_diaria_min   smallint NOT NULL DEFAULT 90 CHECK (meta_diaria_min BETWEEN 15 AND 480 AND meta_diaria_min % 5 = 0),
  liga              liga NOT NULL DEFAULT 'bronze',
  respostas_uteis   integer NOT NULL DEFAULT 0 CHECK (respostas_uteis >= 0),
  relatos_validados integer NOT NULL DEFAULT 0 CHECK (relatos_validados >= 0)
);

CREATE TABLE dominios (
  aluno_id   text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  disciplina disciplina NOT NULL,
  dominio    smallint NOT NULL DEFAULT 0 CHECK (dominio BETWEEN 0 AND 100),
  PRIMARY KEY (aluno_id, disciplina)
);

-- ───────────── Livro-razão de pontos e XP ─────────────

CREATE TABLE lancamentos (
  id          bigserial PRIMARY KEY,
  aluno_id    text NOT NULL REFERENCES pessoas (id),
  pontos      integer NOT NULL DEFAULT 0,
  xp          integer NOT NULL DEFAULT 0,
  origem      origem_lancamento NOT NULL,
  -- Evento que gerou o lançamento ("entrega:at1:ana", "duelo:q9", "sessao:se1"…). Único por aluno+origem:
  -- o mesmo evento nunca credita duas vezes (uma recorreção usa "entrega:at1:ana#2" e lança só a diferença).
  referencia  text,
  disciplina  disciplina,                          -- para o XP semanal por disciplina
  motivo      text NOT NULL,
  autor_id    text REFERENCES pessoas (id),        -- professor, nas atribuições e correções
  criado_em   timestamptz NOT NULL DEFAULT now(),
  CHECK (pontos <> 0 OR xp <> 0),
  -- XP é mérito: nunca é gasto (só a recorreção para baixo ou um estorno reduzem).
  CHECK (xp >= 0 OR origem IN ('correcao', 'estorno')),
  -- Pontos só saem na Loja, na recuperação da sequência, em recorreções ou estornos.
  CHECK (pontos >= 0 OR origem IN ('compra', 'recuperacao_sequencia', 'correcao', 'estorno')),
  -- Constância dá pontos, NUNCA XP (sequência, tempo de estudo, relatos, compras).
  CHECK (xp = 0 OR origem NOT IN ('estudo', 'ciclo', 'sequencia', 'relato', 'compra', 'recuperacao_sequencia')),
  CHECK (origem <> 'compra' OR (pontos < 0 AND xp = 0))
);
CREATE UNIQUE INDEX lancamentos_evento_unico ON lancamentos (aluno_id, origem, referencia) WHERE referencia IS NOT NULL;
CREATE INDEX lancamentos_aluno_data ON lancamentos (aluno_id, criado_em DESC);
CREATE INDEX lancamentos_xp_semana ON lancamentos (criado_em) WHERE xp > 0;

CREATE FUNCTION aplicar_lancamento() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Se o saldo ficar negativo, o CHECK de perfis_aluno aborta a transação inteira (compra atômica).
  UPDATE perfis_aluno SET pontos = pontos + NEW.pontos, xp = xp + NEW.xp WHERE aluno_id = NEW.aluno_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'aluno % sem perfil', NEW.aluno_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER lancamentos_saldo AFTER INSERT ON lancamentos FOR EACH ROW EXECUTE FUNCTION aplicar_lancamento();

-- O extrato é imutável: correção de erro = novo lançamento de estorno.
CREATE FUNCTION bloquear_alteracao() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'tabela % é somente-inserção (use um lançamento de estorno)', TG_TABLE_NAME;
END;
$$;
CREATE TRIGGER lancamentos_imutaveis BEFORE UPDATE OR DELETE ON lancamentos FOR EACH ROW EXECUTE FUNCTION bloquear_alteracao();

-- ───────────── Espaços e feed ─────────────

CREATE TABLE espacos (
  id        text PRIMARY KEY,                     -- "escola", "9A", "robotica", "bilingue" (EspacoId do front)
  nome      text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  tipo      tipo_espaco NOT NULL,
  turma_id  text REFERENCES turmas (id),
  CHECK (tipo <> 'turma' OR turma_id IS NOT NULL)
);

-- Quem participa de clubes/programas (escola e turma são implícitos).
CREATE TABLE espaco_membros (
  espaco_id text NOT NULL REFERENCES espacos (id) ON DELETE CASCADE,
  pessoa_id text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  PRIMARY KEY (espaco_id, pessoa_id)
);

CREATE TABLE anexos (
  id            text PRIMARY KEY,
  dono_id       text NOT NULL REFERENCES pessoas (id),
  nome          text NOT NULL CHECK (length(nome) BETWEEN 1 AND 200),
  mime          text NOT NULL CHECK (mime IN ('application/pdf', 'image/png', 'image/jpeg', 'image/webp')),
  tamanho_bytes integer NOT NULL CHECK (tamanho_bytes BETWEEN 1 AND 10485760),   -- até 10 MB
  paginas       smallint CHECK (paginas > 0),
  chave_storage text NOT NULL UNIQUE,                                           -- caminho no S3/MinIO
  criado_em     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE posts (
  id             text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 64),
  tipo           tipo_post NOT NULL,
  autor_id       text NOT NULL REFERENCES pessoas (id),
  espaco_id      text NOT NULL REFERENCES espacos (id),
  disciplina     disciplina,
  texto          text NOT NULL CHECK (length(texto) BETWEEN 1 AND 5000),
  tags           text[] NOT NULL DEFAULT '{}' CHECK (cardinality(tags) <= 10),
  anexo_id       text REFERENCES anexos (id),
  -- US06: sinalizado pela triagem automática, invisível para os outros até a decisão humana.
  em_revisao     boolean NOT NULL DEFAULT false,
  motivo_triagem text,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  removido_em    timestamptz,
  CHECK (tipo <> 'material' OR anexo_id IS NOT NULL)          -- material sempre tem arquivo
);
CREATE INDEX posts_feed ON posts (espaco_id, criado_em DESC) WHERE removido_em IS NULL AND NOT em_revisao;
CREATE INDEX posts_autor ON posts (autor_id, criado_em DESC);
CREATE INDEX posts_em_revisao ON posts (criado_em) WHERE em_revisao AND removido_em IS NULL;

CREATE TABLE respostas (
  id        text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 64),
  post_id   text NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  autor_id  text NOT NULL REFERENCES pessoas (id),
  texto     text NOT NULL CHECK (length(texto) BETWEEN 1 AND 3000),
  oficial   boolean NOT NULL DEFAULT false,         -- resposta de professor numa dúvida (fixada, US03)
  util      boolean NOT NULL DEFAULT false,         -- marcada pelo autor da dúvida
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX respostas_post ON respostas (post_id, criado_em);

-- "N pessoas acharam útil" (contador `uteis` do front).
CREATE TABLE respostas_uteis (
  resposta_id text NOT NULL REFERENCES respostas (id) ON DELETE CASCADE,
  pessoa_id   text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  criado_em   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (resposta_id, pessoa_id)
);

CREATE TABLE curtidas (
  post_id   text NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  pessoa_id text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  criado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, pessoa_id)
);

CREATE TABLE salvos (
  post_id   text NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  pessoa_id text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  criado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, pessoa_id)
);
CREATE INDEX salvos_pessoa ON salvos (pessoa_id, criado_em DESC);

CREATE TABLE materiais_abertos (
  post_id  text NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  aluno_id text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  dia      date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Maceio')::date,
  PRIMARY KEY (post_id, aluno_id, dia)
);

-- US05: a IA classifica e prioriza; a decisão fica em `moderacoes`, sempre de uma pessoa.
CREATE TABLE denuncias (
  id             text PRIMARY KEY,
  post_id        text NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  denunciante_id text NOT NULL REFERENCES pessoas (id),
  motivo         text NOT NULL CHECK (motivo IN ('Bullying', 'Ofensa', 'Assédio', 'Conteúdo inadequado', 'Spam ou golpe', 'Outro')),
  descricao      text NOT NULL DEFAULT '' CHECK (length(descricao) <= 1000),
  evidencia      boolean NOT NULL DEFAULT false,
  categoria_ia   text NOT NULL,
  prioridade     prioridade NOT NULL,
  confianca      numeric(3, 2) CHECK (confianca BETWEEN 0 AND 1),
  protocolo      text NOT NULL UNIQUE,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, denunciante_id)                        -- 1 denúncia por pessoa por post
);
CREATE INDEX denuncias_fila ON denuncias (prioridade, criado_em);

-- ───────────── Moderação (sempre humana) ─────────────

CREATE TABLE moderacoes (
  id           bigserial PRIMARY KEY,
  post_id      text REFERENCES posts (id) ON DELETE CASCADE,
  mensagem_id  text REFERENCES sala_mensagens (id) ON DELETE CASCADE,   -- mensagem de chat de sala retida pela triagem
  decisao      decisao_moderacao NOT NULL,
  moderador_id text NOT NULL REFERENCES pessoas (id),     -- NUNCA nulo: não existe decisão automática
  observacao   text CHECK (length(observacao) <= 1000),   -- motivo; obrigatório quando decisao = 'removido'
  criado_em    timestamptz NOT NULL DEFAULT now(),
  CHECK ((post_id IS NULL) <> (mensagem_id IS NULL)),
  CHECK (decisao <> 'removido' OR length(btrim(observacao)) > 0)
);
CREATE INDEX moderacoes_post ON moderacoes (post_id) WHERE post_id IS NOT NULL;
CREATE INDEX moderacoes_historico ON moderacoes (criado_em DESC);

-- ───────────── Missões, sequência, prática, desafios e ouvidoria ─────────────

CREATE TABLE missoes (
  id           text PRIMARY KEY,
  tipo         tipo_missao NOT NULL,
  titulo       text NOT NULL,
  descricao    text NOT NULL DEFAULT '',
  disciplina   disciplina,
  professor_id text REFERENCES pessoas (id),
  post_id      text REFERENCES posts (id),
  alvo         smallint NOT NULL CHECK (alvo > 0),
  pontos       smallint NOT NULL DEFAULT 0 CHECK (pontos BETWEEN 0 AND 200),
  xp           smallint NOT NULL DEFAULT 0 CHECK (xp BETWEEN 0 AND 100),
  -- Aceita progresso declarado (POST /missoes/{id}/progresso). As automáticas o servidor calcula por eventos.
  manual       boolean NOT NULL DEFAULT false,
  ativa        boolean NOT NULL DEFAULT true
);

CREATE TABLE missao_progresso (
  missao_id    text NOT NULL REFERENCES missoes (id) ON DELETE CASCADE,
  aluno_id     text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  dia          date NOT NULL,
  progresso    smallint NOT NULL DEFAULT 0 CHECK (progresso >= 0),
  concluida_em timestamptz,
  PRIMARY KEY (missao_id, aluno_id, dia)
);

CREATE TABLE missoes_coletivas (
  id           text PRIMARY KEY,
  turma_id     text NOT NULL REFERENCES turmas (id),
  titulo       text NOT NULL,
  descricao    text NOT NULL DEFAULT '',
  alvo         integer NOT NULL CHECK (alvo > 0),
  pontos_total integer NOT NULL CHECK (pontos_total >= 0),   -- dividido entre os participantes
  xp           smallint NOT NULL CHECK (xp >= 0),            -- cada participante ganha
  inicio       timestamptz NOT NULL,
  fim          timestamptz NOT NULL,
  concluida_em timestamptz,
  CHECK (fim > inicio)
);

CREATE TABLE coletiva_contribuicoes (
  id          bigserial PRIMARY KEY,
  coletiva_id text NOT NULL REFERENCES missoes_coletivas (id) ON DELETE CASCADE,
  aluno_id    text NOT NULL REFERENCES pessoas (id),
  quantidade  smallint NOT NULL CHECK (quantidade BETWEEN 1 AND 50),
  criado_em   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX coletiva_contribuicoes_coletiva ON coletiva_contribuicoes (coletiva_id);

CREATE TABLE sequencias (
  aluno_id            text PRIMARY KEY REFERENCES pessoas (id) ON DELETE CASCADE,
  dias                integer NOT NULL DEFAULT 0 CHECK (dias >= 0),
  dias_sem_congelador integer NOT NULL DEFAULT 0 CHECK (dias_sem_congelador >= 0),
  congeladores        smallint NOT NULL DEFAULT 2,
  congeladores_max    smallint NOT NULL DEFAULT 2 CHECK (congeladores_max >= 0),
  quebrada_em         timestamptz,                  -- recuperável por 200 pontos em até 48 h
  CHECK (congeladores BETWEEN 0 AND congeladores_max)
);

CREATE TABLE sequencia_dias (
  aluno_id text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  dia      date NOT NULL,                           -- no fuso America/Maceio
  status   status_dia NOT NULL,
  PRIMARY KEY (aluno_id, dia)
);

CREATE TABLE flashcards (
  id         serial PRIMARY KEY,
  disciplina disciplina NOT NULL,
  pergunta   text NOT NULL,
  resposta   text NOT NULL,
  ativo      boolean NOT NULL DEFAULT true
);

-- Estado da rodada atual de flashcards (o `Pratica` do front).
CREATE TABLE praticas (
  aluno_id      text PRIMARY KEY REFERENCES pessoas (id) ON DELETE CASCADE,
  fila          integer[] NOT NULL,
  virada        boolean NOT NULL DEFAULT false,
  acertos       smallint NOT NULL DEFAULT 0 CHECK (acertos >= 0),
  vistas        smallint NOT NULL DEFAULT 0 CHECK (vistas >= 0),
  fim           boolean NOT NULL DEFAULT false,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- Cartas criadas pela própria aluna (PUT/DELETE /me/flashcards/{id}); só ela as vê.
CREATE TABLE flashcards_proprios (
  id         text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 64),   -- id do cliente
  aluno_id   text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  disciplina disciplina NOT NULL,
  pergunta   text NOT NULL CHECK (length(pergunta) BETWEEN 1 AND 300),
  resposta   text NOT NULL CHECK (length(resposta) BETWEEN 1 AND 600),
  criado_em  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX flashcards_proprios_aluno ON flashcards_proprios (aluno_id);

-- Repetição espaçada (Leitner): caixa 1 (nova/errou) a 5 (dominada). Atualizada pelo SERVIDOR em POST /pratica/respostas:
-- acertou sobe uma caixa, errou volta à 1; `proxima` = hoje + {1:0, 2:1, 3:3, 4:7, 5:15} dias.
CREATE TABLE flashcards_caixas (
  aluno_id  text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  carta_id  text NOT NULL,                                -- id de `flashcards` (como texto) ou de `flashcards_proprios`
  caixa     smallint NOT NULL DEFAULT 1 CHECK (caixa BETWEEN 1 AND 5),
  proxima   timestamptz NOT NULL DEFAULT now(),
  errada    boolean NOT NULL DEFAULT false,               -- errou na última vez (alimenta a rodada "Erradas")
  PRIMARY KEY (aluno_id, carta_id)
);

CREATE TABLE pratica_respostas (
  id           bigserial PRIMARY KEY,
  aluno_id     text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  flashcard_id integer REFERENCES flashcards (id),
  carta_propria_id text REFERENCES flashcards_proprios (id) ON DELETE SET NULL,
  acertou      boolean NOT NULL,
  contabilizada_coletiva boolean NOT NULL DEFAULT false,   -- já contou na missão coletiva?
  criado_em    timestamptz NOT NULL DEFAULT now(),
  CHECK ((flashcard_id IS NULL) <> (carta_propria_id IS NULL))
);
CREATE INDEX pratica_respostas_aluno ON pratica_respostas (aluno_id, criado_em DESC);

-- Banco de questões dos desafios (US09B) e dos quizzes de campeonato. O gabarito nunca vai ao cliente antes da resposta.
CREATE TABLE questoes (
  id          text PRIMARY KEY,
  disciplina  disciplina NOT NULL,
  tema        text NOT NULL,
  enunciado   text NOT NULL,
  opcoes      text[] NOT NULL CHECK (cardinality(opcoes) BETWEEN 2 AND 6),
  correta     smallint NOT NULL,
  explicacao  text NOT NULL DEFAULT '',
  dificuldade smallint NOT NULL DEFAULT 2 CHECK (dificuldade BETWEEN 1 AND 3),
  ativa       boolean NOT NULL DEFAULT true,
  CHECK (correta >= 0 AND correta < cardinality(opcoes))
);
CREATE INDEX questoes_disciplina ON questoes (disciplina) WHERE ativa;

CREATE TABLE desafio_tentativas (
  id           text PRIMARY KEY,
  aluno_id     text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  disciplina   disciplina NOT NULL,
  questoes     text[] NOT NULL,                   -- ids sorteados no servidor
  respostas    smallint[],                        -- NULL até responder
  acertos      smallint CHECK (acertos >= 0),
  aberta_em    timestamptz NOT NULL DEFAULT now(),
  expira_em    timestamptz NOT NULL,
  respondida_em timestamptz,
  CHECK (expira_em > aberta_em),
  CHECK ((respondida_em IS NULL) = (respostas IS NULL))
);
CREATE INDEX desafio_tentativas_aluno ON desafio_tentativas (aluno_id, aberta_em DESC);

CREATE TABLE relatos (
  id           text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 64),
  aluno_id     text NOT NULL REFERENCES pessoas (id),
  categoria    text NOT NULL CHECK (categoria IN ('Estrutura', 'Biblioteca', 'Merenda', 'Tecnologia', 'Convivência', 'Outro')),
  texto        text NOT NULL CHECK (length(texto) BETWEEN 10 AND 2000),
  status       status_relato NOT NULL DEFAULT 'em análise',
  resposta     text,
  decidido_por text REFERENCES pessoas (id),        -- coordenação (PUT /moderacao/relatos/{id}); a recompensa é lançada no servidor
  criado_em    timestamptz NOT NULL DEFAULT now(),
  decidido_em  timestamptz,
  CHECK ((status <> 'em análise') = (decidido_em IS NOT NULL))
);
CREATE INDEX relatos_fila ON relatos (criado_em) WHERE status = 'em análise';

-- ───────────── Loja ─────────────

CREATE TABLE itens_loja (
  id        text PRIMARY KEY,
  aba       aba_loja NOT NULL,
  nome      text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  raridade  raridade NOT NULL,
  custo     integer NOT NULL CHECK (custo > 0),
  slot      slot_item NOT NULL,
  icone     text NOT NULL,
  estoque   integer CHECK (estoque >= 0),        -- NULL = ilimitado (itens digitais)
  ativo     boolean NOT NULL DEFAULT true,
  CHECK ((aba = 'escola') = (slot = 'voucher'))
);

CREATE TABLE compras (
  id            text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 64),
  aluno_id      text NOT NULL REFERENCES pessoas (id),
  item_id       text NOT NULL REFERENCES itens_loja (id),
  custo         integer NOT NULL CHECK (custo > 0),              -- preço no momento da compra
  lancamento_id bigint NOT NULL UNIQUE REFERENCES lancamentos (id),
  voucher       text UNIQUE,                                     -- gerado NO SERVIDOR (recompensas da escola)
  entregue_em   timestamptz,                                     -- recompensa física entregue (PUT /loja/compras/{id}/entrega)
  entregue_por  text REFERENCES pessoas (id),                    -- professor/secretaria que marcou (nunca nulo quando entregue)
  criado_em     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (aluno_id, item_id),                                    -- cada item uma vez só (regra do front)
  CHECK ((entregue_em IS NULL) = (entregue_por IS NULL))
);

-- Um item por slot, e só item comprado (FK composta para `compras`).
CREATE TABLE itens_equipados (
  aluno_id text NOT NULL,
  slot     slot_item NOT NULL CHECK (slot <> 'voucher'),
  item_id  text NOT NULL,
  PRIMARY KEY (aluno_id, slot),
  FOREIGN KEY (aluno_id, item_id) REFERENCES compras (aluno_id, item_id) ON DELETE CASCADE
);

CREATE TABLE medalhas (
  id       text PRIMARY KEY,
  nome     text NOT NULL,
  criterio text NOT NULL,
  icone    text NOT NULL,
  meta     integer NOT NULL CHECK (meta > 0)
);

CREATE TABLE medalhas_aluno (
  aluno_id        text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  medalha_id      text NOT NULL REFERENCES medalhas (id),
  desbloqueada_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (aluno_id, medalha_id)
);

-- ───────────── Calendário ─────────────

CREATE TABLE eventos (
  id         text PRIMARY KEY,
  titulo     text NOT NULL,
  tipo       tipo_evento NOT NULL,
  disciplina disciplina,
  turma_id   text REFERENCES turmas (id),            -- NULL = escola inteira
  inicio     timestamptz NOT NULL,
  local      text
);
CREATE INDEX eventos_periodo ON eventos (inicio);

CREATE TABLE lembretes (
  pessoa_id   text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  evento_id   text NOT NULL REFERENCES eventos (id) ON DELETE CASCADE,
  -- PUT /me/lembretes-agendados: quando o servidor deve notificar. NULL = só marcado, sem horário.
  disparo_em  timestamptz,
  disparado_em timestamptz,                          -- já virou notificação (job idempotente)
  PRIMARY KEY (pessoa_id, evento_id)
);
CREATE INDEX lembretes_a_disparar ON lembretes (disparo_em) WHERE disparo_em IS NOT NULL AND disparado_em IS NULL;

-- "Lembrar alunos" (POST /professor/lembretes): histórico e TRAVA — no máximo 1 aviso a cada 12 h por aluno.
CREATE TABLE lembretes_professor (
  id           bigserial PRIMARY KEY,
  professor_id text NOT NULL REFERENCES pessoas (id),
  aluno_id     text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  enviado_em   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lembretes_professor_trava ON lembretes_professor (aluno_id, enviado_em DESC);

-- ───────────── Salas de estudo ─────────────

CREATE TABLE salas (
  id            text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 64),
  nome          text NOT NULL CHECK (length(nome) BETWEEN 3 AND 60),
  descricao     text NOT NULL DEFAULT '' CHECK (length(descricao) <= 280),
  disciplina    disciplina,                         -- NULL = sala livre
  criador_id    text NOT NULL REFERENCES pessoas (id),
  oficial       boolean NOT NULL DEFAULT false,     -- criada por professor/coordenação
  privada       boolean NOT NULL DEFAULT false,
  codigo        text UNIQUE CHECK (codigo ~ '^SALA-[A-Z0-9]{4}$'),   -- gerado no servidor
  foco_min      smallint NOT NULL CHECK (foco_min BETWEEN 5 AND 120),
  pausa_min     smallint NOT NULL CHECK (pausa_min BETWEEN 1 AND 60),
  ciclo_inicio  timestamptz NOT NULL,               -- âncora do ciclo sincronizado
  capacidade    smallint NOT NULL CHECK (capacidade BETWEEN 2 AND 100),
  tema          tema_sala NOT NULL DEFAULT 'esmeralda',
  agendada_para timestamptz,
  turma_id      text REFERENCES turmas (id),
  criada_em     timestamptz NOT NULL DEFAULT now(),
  fechada_em    timestamptz,
  CHECK (privada = (codigo IS NOT NULL))
);
CREATE INDEX salas_abertas ON salas (criada_em DESC) WHERE fechada_em IS NULL;

-- Histórico de presença (a presença "ao vivo" fica no Redis). Uma sala aberta por pessoa.
CREATE TABLE sala_presencas (
  id        bigserial PRIMARY KEY,
  sala_id   text NOT NULL REFERENCES salas (id) ON DELETE CASCADE,
  pessoa_id text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  entrou_em timestamptz NOT NULL DEFAULT now(),
  saiu_em   timestamptz,
  CHECK (saiu_em IS NULL OR saiu_em >= entrou_em)
);
CREATE UNIQUE INDEX sala_presencas_uma_por_vez ON sala_presencas (pessoa_id) WHERE saiu_em IS NULL;
CREATE INDEX sala_presencas_sala ON sala_presencas (sala_id) WHERE saiu_em IS NULL;

CREATE TABLE sala_mensagens (
  id        text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 64),
  sala_id   text NOT NULL REFERENCES salas (id) ON DELETE CASCADE,
  autor_id  text NOT NULL REFERENCES pessoas (id),
  texto     text NOT NULL CHECK (length(texto) BETWEEN 1 AND 500),
  tipo      tipo_mensagem_sala NOT NULL DEFAULT 'mensagem',
  retida         boolean NOT NULL DEFAULT false,          -- US06: não é entregue à sala até a revisão humana
  motivo_triagem text,
  removida_em    timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sala_mensagens_sala ON sala_mensagens (sala_id, criado_em DESC) WHERE NOT retida AND removida_em IS NULL;
CREATE INDEX sala_mensagens_retidas ON sala_mensagens (criado_em) WHERE retida AND removida_em IS NULL;

-- ───────────── Tempo de estudo ─────────────

CREATE TABLE sessoes_estudo (
  id                 text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 64),
  aluno_id           text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  disciplina         disciplina NOT NULL,
  inicio             timestamptz NOT NULL,
  fim                timestamptz NOT NULL,
  minutos            smallint NOT NULL CHECK (minutos BETWEEN 1 AND 240),       -- mínimo 1 min; bloco máximo de 4 h
  origem             origem_sessao NOT NULL,
  sala_id            text REFERENCES salas (id) ON DELETE SET NULL,
  -- Minutos que renderam pontos: limitados pelo teto diário (anti-farm). Manual nunca rende.
  minutos_com_pontos smallint NOT NULL DEFAULT 0,
  criado_em          timestamptz NOT NULL DEFAULT now(),
  CHECK (extract(epoch FROM fim - inicio) = minutos * 60),
  CHECK (minutos_com_pontos BETWEEN 0 AND minutos),
  CHECK (origem <> 'manual' OR minutos_com_pontos = 0),
  CHECK (origem = 'sala' OR sala_id IS NULL),
  CHECK (fim <= criado_em + interval '5 minutes'),          -- nada de sessão no futuro (tolerância de relógio)
  -- Dois blocos do mesmo aluno não podem se sobrepor no tempo (estudar "em dobro").
  EXCLUDE USING gist (aluno_id WITH =, tstzrange(inicio, fim) WITH &&)
);
CREATE INDEX sessoes_estudo_aluno ON sessoes_estudo (aluno_id, inicio DESC);

-- Timer em andamento (opcional: continuar em outro aparelho). É o `TimerAtivo` do front.
CREATE TABLE timers_ativos (
  aluno_id      text PRIMARY KEY REFERENCES pessoas (id) ON DELETE CASCADE,
  dados         jsonb NOT NULL,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- ───────────── Campeonatos ─────────────

CREATE TABLE campeonatos (
  id                text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 64),
  nome              text NOT NULL CHECK (length(nome) BETWEEN 3 AND 80),
  descricao         text NOT NULL DEFAULT '' CHECK (length(descricao) <= 500),
  formato           formato_campeonato NOT NULL,
  metrica           metrica_campeonato NOT NULL,
  disciplina        disciplina,
  criador_id        text NOT NULL REFERENCES pessoas (id),
  oficial           boolean NOT NULL,              -- true só se o criador é professor/coordenação
  status            status_campeonato NOT NULL DEFAULT 'inscricoes',
  inicio            timestamptz NOT NULL,
  fim               timestamptz NOT NULL,
  premio_pontos     integer NOT NULL DEFAULT 0 CHECK (premio_pontos BETWEEN 0 AND 2000),
  premio_xp         integer NOT NULL DEFAULT 0 CHECK (premio_xp BETWEEN 0 AND 1000),
  premio_titulo     text,
  max_participantes smallint NOT NULL CHECK (max_participantes BETWEEN 2 AND 128),
  campeao           text,                          -- id do aluno ou da turma (interclasses)
  capa              capa_campeonato NOT NULL DEFAULT 'ouro',
  criado_em         timestamptz NOT NULL DEFAULT now(),
  CHECK (fim > inicio),
  -- Amistoso de aluno não emite pontos nem XP da escola.
  CHECK (oficial OR (premio_pontos = 0 AND premio_xp = 0)),
  CHECK (formato <> 'interclasses' OR oficial),
  CHECK ((status = 'encerrado') OR campeao IS NULL)
);
CREATE INDEX campeonatos_status ON campeonatos (status, inicio DESC);

-- Turmas que podem participar (nenhuma linha = escola inteira).
CREATE TABLE campeonato_turmas (
  campeonato_id text NOT NULL REFERENCES campeonatos (id) ON DELETE CASCADE,
  turma_id      text NOT NULL REFERENCES turmas (id),
  PRIMARY KEY (campeonato_id, turma_id)
);

-- Participante é um aluno OU uma turma (interclasses). `pontos` = placar dos pontos corridos.
CREATE TABLE campeonato_participantes (
  id            bigserial PRIMARY KEY,
  campeonato_id text NOT NULL REFERENCES campeonatos (id) ON DELETE CASCADE,
  aluno_id      text REFERENCES pessoas (id) ON DELETE CASCADE,
  turma_id      text REFERENCES turmas (id),
  pontos        integer NOT NULL DEFAULT 0 CHECK (pontos >= 0),
  inscrito_em   timestamptz NOT NULL DEFAULT now(),
  CHECK ((aluno_id IS NULL) <> (turma_id IS NULL)),
  UNIQUE (campeonato_id, aluno_id),
  UNIQUE (campeonato_id, turma_id)
);

CREATE TABLE partidas (
  id            text PRIMARY KEY,
  campeonato_id text NOT NULL REFERENCES campeonatos (id) ON DELETE CASCADE,
  rodada        smallint NOT NULL CHECK (rodada >= 0),       -- 0 = primeira fase, sobe até a final
  a_id          text REFERENCES pessoas (id),
  b_id          text REFERENCES pessoas (id),
  placar_a      smallint CHECK (placar_a >= 0),
  placar_b      smallint CHECK (placar_b >= 0),
  vencedor_id   text REFERENCES pessoas (id),
  status        status_partida NOT NULL DEFAULT 'aguardando',
  CHECK (a_id IS NULL OR b_id IS NULL OR a_id <> b_id),
  CHECK (vencedor_id IS NULL OR vencedor_id = a_id OR vencedor_id = b_id),
  CHECK (status <> 'encerrada' OR vencedor_id IS NOT NULL)
);
CREATE INDEX partidas_campeonato ON partidas (campeonato_id, rodada);

-- Quiz aberto no servidor (duelo do mata-mata ou rodada dos pontos corridos). As MESMAS perguntas para os dois jogadores.
CREATE TABLE quizzes (
  id            text PRIMARY KEY,
  campeonato_id text NOT NULL REFERENCES campeonatos (id) ON DELETE CASCADE,
  partida_id    text REFERENCES partidas (id) ON DELETE CASCADE,
  tipo          tipo_quiz NOT NULL,
  perguntas     text[] NOT NULL CHECK (cardinality(perguntas) BETWEEN 1 AND 20),   -- ids de `questoes`
  segundos_por_pergunta smallint NOT NULL DEFAULT 20 CHECK (segundos_por_pergunta BETWEEN 5 AND 120),
  aberto_em     timestamptz NOT NULL DEFAULT now(),
  expira_em     timestamptz NOT NULL,
  CHECK ((tipo = 'duelo') = (partida_id IS NOT NULL)),
  CHECK (expira_em > aberto_em)
);
CREATE UNIQUE INDEX quizzes_um_duelo_por_partida ON quizzes (partida_id) WHERE partida_id IS NOT NULL;

-- Uma tentativa por jogador: a PK impede responder de novo.
CREATE TABLE quiz_participacoes (
  quiz_id       text NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
  aluno_id      text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  respostas     smallint[],
  acertos       smallint CHECK (acertos >= 0),
  tempo_ms      integer CHECK (tempo_ms >= 0),     -- medido no servidor (desempate)
  iniciado_em   timestamptz NOT NULL DEFAULT now(),
  respondido_em timestamptz,
  PRIMARY KEY (quiz_id, aluno_id),
  CHECK ((respondido_em IS NULL) = (acertos IS NULL))
);

-- ───────────── Atividades ─────────────

CREATE TABLE atividades (
  id           text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 64),
  titulo       text NOT NULL CHECK (length(titulo) BETWEEN 3 AND 120),
  descricao    text NOT NULL DEFAULT '' CHECK (length(descricao) <= 4000),
  tipo         tipo_atividade NOT NULL,
  disciplina   disciplina NOT NULL,
  professor_id text NOT NULL REFERENCES pessoas (id),
  turma_id     text NOT NULL REFERENCES turmas (id),
  criada_em    timestamptz NOT NULL DEFAULT now(),
  prazo        timestamptz NOT NULL,
  pontos       smallint NOT NULL CHECK (pontos BETWEEN 0 AND 500),   -- recompensa MÁXIMA (nota 10)
  xp           smallint NOT NULL CHECK (xp BETWEEN 0 AND 300),
  anexo_id     text REFERENCES anexos (id),
  post_id      text REFERENCES posts (id),
  excluida_em  timestamptz,
  CHECK (prazo > criada_em)
);
CREATE INDEX atividades_turma ON atividades (turma_id, prazo) WHERE excluida_em IS NULL;
CREATE INDEX atividades_professor ON atividades (professor_id, criada_em DESC);

CREATE TABLE entregas (
  atividade_id  text NOT NULL REFERENCES atividades (id) ON DELETE CASCADE,
  aluno_id      text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  status        status_entrega NOT NULL DEFAULT 'pendente',
  entregue_em   timestamptz,
  resposta      text CHECK (length(resposta) <= 10000),
  anexo_id      text REFERENCES anexos (id),
  nota          numeric(3, 1) CHECK (nota BETWEEN 0 AND 10),
  feedback      text CHECK (length(feedback) <= 2000),
  pontos        smallint CHECK (pontos >= 0),      -- calculados pelo gatilho abaixo, proporcionais à nota
  xp            smallint CHECK (xp >= 0),
  corrigida_em  timestamptz,
  corrigida_por text REFERENCES pessoas (id),
  PRIMARY KEY (atividade_id, aluno_id),
  CHECK (status <> 'entregue' OR entregue_em IS NOT NULL),
  CHECK ((status = 'corrigida') = (nota IS NOT NULL AND corrigida_em IS NOT NULL AND corrigida_por IS NOT NULL))
);
CREATE INDEX entregas_aluno ON entregas (aluno_id, status);

-- Correção proporcional à nota, calculada NO BANCO: o cliente não consegue mandar "pontos".
CREATE FUNCTION recompensa_da_correcao() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  max_pontos smallint;
  max_xp     smallint;
BEGIN
  IF NEW.status = 'corrigida' THEN
    SELECT a.pontos, a.xp INTO max_pontos, max_xp FROM atividades a WHERE a.id = NEW.atividade_id;
    NEW.pontos := round(max_pontos * NEW.nota / 10);
    NEW.xp     := round(max_xp * NEW.nota / 10);
  ELSE
    NEW.pontos := NULL;
    NEW.xp     := NULL;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER entregas_recompensa BEFORE INSERT OR UPDATE OF status, nota ON entregas
  FOR EACH ROW EXECUTE FUNCTION recompensa_da_correcao();

-- Só o professor da turma corrige (e atribui pontos — ver `atribuicoes`).
CREATE FUNCTION exigir_professor_da_turma(professor text, aluno text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM professor_turmas pt JOIN pessoas p ON p.turma_id = pt.turma_id
    WHERE pt.professor_id = professor AND p.id = aluno
  ) THEN
    RAISE EXCEPTION 'professor % não leciona na turma do aluno %', professor, aluno USING ERRCODE = 'check_violation';
  END IF;
END;
$$;

CREATE FUNCTION checar_corretor() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'corrigida' THEN
    PERFORM exigir_professor_da_turma(NEW.corrigida_por, NEW.aluno_id);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER entregas_corretor BEFORE INSERT OR UPDATE OF status, nota ON entregas
  FOR EACH ROW EXECUTE FUNCTION checar_corretor();

-- ───────────── Professor: atribuições manuais ─────────────

CREATE TABLE atribuicoes (
  id            text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 64),
  professor_id  text NOT NULL REFERENCES pessoas (id),
  aluno_id      text NOT NULL REFERENCES pessoas (id),
  pontos        smallint NOT NULL DEFAULT 0 CHECK (pontos BETWEEN 0 AND 200),   -- limite por lançamento
  xp            smallint NOT NULL DEFAULT 0 CHECK (xp BETWEEN 0 AND 100),
  motivo        text NOT NULL CHECK (length(motivo) BETWEEN 3 AND 200),         -- auditável: sempre com motivo
  lancamento_id bigint NOT NULL UNIQUE REFERENCES lancamentos (id),
  criado_em     timestamptz NOT NULL DEFAULT now(),
  CHECK (pontos > 0 OR xp > 0)
);
CREATE INDEX atribuicoes_aluno ON atribuicoes (aluno_id, criado_em DESC);
CREATE INDEX atribuicoes_professor ON atribuicoes (professor_id, criado_em DESC);

CREATE FUNCTION checar_atribuicao() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM exigir_professor_da_turma(NEW.professor_id, NEW.aluno_id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER atribuicoes_turma BEFORE INSERT ON atribuicoes FOR EACH ROW EXECUTE FUNCTION checar_atribuicao();
CREATE TRIGGER atribuicoes_imutaveis BEFORE UPDATE OR DELETE ON atribuicoes FOR EACH ROW EXECUTE FUNCTION bloquear_alteracao();

-- ───────────── Notificações ─────────────

CREATE TABLE notificacoes (
  id        text PRIMARY KEY,
  para_id   text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  tipo      tipo_notificacao NOT NULL,
  titulo    text NOT NULL CHECK (length(titulo) <= 140),
  texto     text CHECK (length(texto) <= 500),
  href      text CHECK (href ~ '^/'),                -- só rotas internas do app
  de_id     text REFERENCES pessoas (id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  lida_em   timestamptz
);
CREATE INDEX notificacoes_caixa ON notificacoes (para_id, criado_em DESC);
CREATE INDEX notificacoes_nao_lidas ON notificacoes (para_id) WHERE lida_em IS NULL;

-- ───────────── Ligas (fechamento semanal) ─────────────

CREATE TABLE ligas_semana (
  aluno_id  text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  semana    date NOT NULL CHECK (extract(isodow FROM semana) = 1),   -- segunda-feira
  liga      liga NOT NULL,
  xp_semana integer NOT NULL CHECK (xp_semana >= 0),
  posicao   integer NOT NULL CHECK (posicao > 0),
  resultado text NOT NULL CHECK (resultado IN ('sobe', 'desce', 'manteve')),
  PRIMARY KEY (aluno_id, semana)
);

-- ───────────── Infraestrutura: sessões, idempotência e auditoria ─────────────

-- Refresh tokens (guardamos só o hash). Expiram em 30 dias; logout revoga.
CREATE TABLE sessoes_auth (
  id          uuid PRIMARY KEY,
  pessoa_id   text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  hash_token  text NOT NULL UNIQUE,
  criado_em   timestamptz NOT NULL DEFAULT now(),
  expira_em   timestamptz NOT NULL,
  revogado_em timestamptz,
  agente      text,                                  -- navegador (para "sair de outros aparelhos")
  CHECK (expira_em > criado_em)
);
CREATE INDEX sessoes_auth_pessoa ON sessoes_auth (pessoa_id) WHERE revogado_em IS NULL;

-- Header Idempotency-Key: a mesma chave devolve a MESMA resposta (reenvios da fila do front). Limpar após 24 h.
CREATE TABLE idempotencia (
  pessoa_id text NOT NULL REFERENCES pessoas (id) ON DELETE CASCADE,
  chave     text NOT NULL CHECK (length(chave) BETWEEN 1 AND 128),
  metodo    text NOT NULL,
  caminho   text NOT NULL,
  status    smallint NOT NULL,
  resposta  jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (pessoa_id, chave)
);
CREATE INDEX idempotencia_limpeza ON idempotencia (criado_em);

-- Quem fez o quê: moderação, correções, atribuições, mudanças de papel, exportações de dados (LGPD).
CREATE TABLE auditoria (
  id        bigserial PRIMARY KEY,
  ator_id   text REFERENCES pessoas (id) ON DELETE SET NULL,
  acao      text NOT NULL,
  alvo      text,
  dados     jsonb NOT NULL DEFAULT '{}',
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auditoria_data ON auditoria (criado_em DESC);
CREATE TRIGGER auditoria_imutavel BEFORE UPDATE OR DELETE ON auditoria FOR EACH ROW EXECUTE FUNCTION bloquear_alteracao();

-- ───────────── Views de ranking (privacidade garantida no SQL) ─────────────
--
-- Endpoints públicos (GET /ranking/*) leem SÓ as views `*_publico`:
-- - Modo Sombra nunca aparece (nem como anônimo);
-- - anônimo vira "Aluno anônimo", sem iniciais e sem turma, com um id opaco que muda toda semana
--   (hash com segredo: `SET app.segredo_anonimato = '…'` na conexão, vindo de variável de ambiente).
-- A posição do PRÓPRIO aluno (inclusive no Modo Sombra) é calculada à parte, só para ele, a partir de
-- `v_xp_semana`/`v_foco_semana` — essas duas views são internas e NUNCA vão direto para a resposta.

CREATE VIEW v_xp_semana AS
SELECT
  l.aluno_id,
  date_trunc('week', l.criado_em AT TIME ZONE 'America/Maceio')::date AS semana,
  sum(l.xp)::integer AS xp
FROM lancamentos l
WHERE l.xp > 0
GROUP BY 1, 2;

-- Minutos de foco por semana. Registros manuais não entram no ranking (anti-farm); só timer e sala.
CREATE VIEW v_foco_semana AS
SELECT
  s.aluno_id,
  date_trunc('week', s.inicio AT TIME ZONE 'America/Maceio')::date AS semana,
  sum(s.minutos)::integer AS minutos
FROM sessoes_estudo s
WHERE s.origem IN ('timer', 'sala')
GROUP BY 1, 2;

CREATE VIEW v_ranking_liga_publico AS
SELECT
  x.semana,
  pa.liga,
  CASE WHEN pa.privacidade = 'anonimo'
       THEN 'anon_' || left(md5(current_setting('app.segredo_anonimato') || p.id || x.semana::text), 12)
       ELSE p.id END AS id,
  CASE WHEN pa.privacidade = 'anonimo' THEN 'Aluno anônimo' ELSE p.nome END AS nome,
  CASE WHEN pa.privacidade = 'anonimo' THEN '?' ELSE p.iniciais END AS iniciais,
  CASE WHEN pa.privacidade = 'anonimo' THEN '—' ELSE t.nome END AS turma,
  p.turma_id,                                   -- para filtrar o escopo "turma"; não vai na resposta
  x.xp,
  pa.privacidade = 'anonimo' AS anonimo,
  rank() OVER (PARTITION BY x.semana, pa.liga ORDER BY x.xp DESC) AS posicao
FROM v_xp_semana x
JOIN perfis_aluno pa ON pa.aluno_id = x.aluno_id
JOIN pessoas p ON p.id = x.aluno_id AND p.ativo AND p.anonimizado_em IS NULL
JOIN turmas t ON t.id = p.turma_id
WHERE pa.privacidade <> 'sombra';

CREATE VIEW v_ranking_foco_publico AS
SELECT
  f.semana,
  CASE WHEN pa.privacidade = 'anonimo'
       THEN 'anon_' || left(md5(current_setting('app.segredo_anonimato') || p.id || f.semana::text), 12)
       ELSE p.id END AS id,
  CASE WHEN pa.privacidade = 'anonimo' THEN 'Aluno anônimo' ELSE p.nome END AS nome,
  CASE WHEN pa.privacidade = 'anonimo' THEN '—' ELSE t.nome END AS turma,
  p.turma_id,
  f.minutos,
  pa.privacidade = 'anonimo' AS anonimo,
  rank() OVER (PARTITION BY f.semana ORDER BY f.minutos DESC) AS posicao_escola,
  rank() OVER (PARTITION BY f.semana, p.turma_id ORDER BY f.minutos DESC) AS posicao_turma
FROM v_foco_semana f
JOIN perfis_aluno pa ON pa.aluno_id = f.aluno_id
JOIN pessoas p ON p.id = f.aluno_id AND p.ativo AND p.anonimizado_em IS NULL
JOIN turmas t ON t.id = p.turma_id
WHERE pa.privacidade <> 'sombra';

-- ───────────── Estatísticas e histórico de moderação ─────────────
--
-- GET /me/estatisticas e GET /professor/estatisticas AGREGAM no servidor (o front só desenha). Não há tabela nova:
-- a base é `sessoes_estudo` (foco), `entregas` (notas), `lancamentos` (pontos e XP por dia), `missao_progresso`,
-- `quiz_participacoes`/`partidas` (duelos), `medalhas_aluno` e `sequencia_dias`. As views abaixo cobrem as duas
-- consultas mais repetidas; o restante vira consulta no endpoint (cache de 1–5 min por turma/período).

-- Minutos de estudo por aluno e dia (fuso da escola). Base de séries, mapa de calor e "alunos em risco".
CREATE VIEW v_estudo_dia AS
SELECT
  s.aluno_id,
  (s.inicio AT TIME ZONE 'America/Maceio')::date AS dia,
  s.disciplina,
  sum(s.minutos)::integer AS minutos
FROM sessoes_estudo s
GROUP BY 1, 2, 3;

-- Histórico de moderação (GET /moderacao/historico): posts e mensagens de sala, com o texto e o motivo.
CREATE VIEW v_historico_moderacao AS
SELECT
  m.id, 'post'::text AS tipo, m.post_id AS alvo_id, m.decisao, m.moderador_id, m.criado_em AS em,
  m.observacao AS motivo, p.autor_id, p.texto
FROM moderacoes m JOIN posts p ON p.id = m.post_id
UNION ALL
SELECT
  m.id, 'mensagem_sala'::text, m.mensagem_id, m.decisao, m.moderador_id, m.criado_em,
  m.observacao, sm.autor_id, sm.texto
FROM moderacoes m JOIN sala_mensagens sm ON sm.id = m.mensagem_id;

COMMENT ON VIEW v_estudo_dia IS 'Minutos por aluno/dia/disciplina; fonte das estatísticas (aluno e professor).';
COMMENT ON VIEW v_historico_moderacao IS 'Decisões de moderação (posts e chat de sala). Só professores/coordenação leem.';
COMMENT ON VIEW v_xp_semana IS 'INTERNA: contém quem está no Modo Sombra. Nunca exponha em endpoint público.';
COMMENT ON VIEW v_foco_semana IS 'INTERNA: contém quem está no Modo Sombra. Nunca exponha em endpoint público.';
COMMENT ON VIEW v_ranking_liga_publico IS 'Ranking semanal de XP para GET /ranking/liga (sem Modo Sombra, anônimos mascarados).';
COMMENT ON VIEW v_ranking_foco_publico IS 'Ranking semanal de foco para GET /ranking/foco (sem Modo Sombra, anônimos mascarados, sem registros manuais).';

COMMIT;
