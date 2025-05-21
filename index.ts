// Importando bibliotecas necessárias
import mysql, { Connection } from 'mysql2/promise'; //conectar ao MySQL de forma assincrona
import fastify, { FastifyRequest, FastifyReply } from 'fastify'; 
import cors from '@fastify/cors'; // Middleware para permitir requisições de outros domínios (CORS)

const app = fastify(); // Inicializa o servidor Fastify
app.register(cors); // Habilita o CORS

// Função para criar uma conexão com o banco de dados MySQL
async function createDatabaseConnection(): Promise<Connection> {
    return await mysql.createConnection({
        host: 'localhost',      // Endereço do servidor MySQL
        user: 'root',           // Usuário do banco
        password: '',           // Senha do banco
        database: 'listagem_produtos' // Nome do banco de dados
    });
}

// Rota principal apenas para teste
app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.send("Fastify Funcionando"); // Retorna uma mensagem de sucesso
});

// Rota para listar todos os produtos da tabela "lista"
app.get('/lista', async (request: FastifyRequest, reply: FastifyReply) => {
    let conn: Connection | null = null;

    try {
        conn = await createDatabaseConnection(); // Cria conexão com o banco
        const [rows] = await conn.query<any>("SELECT * FROM lista"); // Executa SELECT na tabela
        reply.status(200).send(rows); // Retorna os dados encontrados
    } catch (erro: any) {
        console.error("Erro ao buscar estoque:", erro); // Mostra erro no terminal

        // Verifica o tipo de erro e retorna uma mensagem personalizada
        if (erro.code === 'ECONNREFUSED') {
            reply.status(400).send({ mensagem: "ERRO: LIGUE O LARAGAO => Conexão Recusada" });
        } else if (erro.code === 'ER_BAD_DB_ERROR') {
            reply.status(400).send({ mensagem: "ERRO: CRIE UM BANCO DE DADOS COM O NOME DEFINIDO NA CONEXÃO" });
        } else if (erro.code === 'ER_ACCESS_DENIED_ERROR') {
            reply.status(400).send({ mensagem: "ERRO: CONFERIR O USUÁRIO E SENHA DEFINIDOS NA CONEXÃO" });
        } else if (erro.code === 'ER_NO_SUCH_TABLE') {
            reply.status(400).send({ mensagem: "ERRO: Você deve criar a tabela com o mesmo nome da sua QUERY" });
        } else if (erro.code === 'ER_PARSE_ERROR') {
            reply.status(400).send({ mensagem: "ERRO: Você tem um erro de escrita em sua QUERY confira: VÍRGULAS, PARENTESES E NOME DE COLUNAS" });
        } else {
            reply.status(500).send({ mensagem: "ERRO: NÃO IDENTIFICADO" }); // Erro interno generico
        }
    } finally {
        if (conn) {
            await conn.end(); // Fecha a conexao ao final
        }
    }
});

// Rota para buscar produtos (sapatos) por filtros: id, nome, tamanho e preco
app.get('/sapatos', async (request: FastifyRequest, reply: FastifyReply) => {
    let conn: Connection | null = null;

    // Extrai os parâmetros da query string (ex: /sapatos?nome=Tenis)
    const { nome, tamanho, id, preco } = request.query as {
        nome?: string;
        tamanho?: string;
        id?: string;
        preco?: string;
    };

    // Verifica se nenhum filtro foi enviado
    if (!nome && !tamanho && !id && !preco) {
        return reply.status(400).send({ mensagem: "Escolha os produtos disponíveis" });
    }

    let query = "SELECT * FROM lista WHERE 1=1"; // Base da query
    const values: any[] = []; // Lista de valores que serão inseridos na query

    // Adiciona os filtros dinamicamente conforme os parametros enviados
    if (id) {
        query += " AND id = ?";
        values.push(id);
    }

    if (nome) {
        query += " AND nome LIKE ?";
        values.push(`%${nome}%`); // Busca por nome aproximado
    }

    if (tamanho) {
        query += " AND tamanho = ?";
        values.push(tamanho);
    }

    if (preco) {
        query += " AND preco = ?";
        values.push(preco);
    }

    try {
        conn = await createDatabaseConnection(); // Abre conexao
        const [rows] = await conn.query<any>(query, values); // Executa a query com os filtros

        if (rows.length > 0) {
            reply.status(200).send(rows); // Retorna os produtos encontrados
        } else {
            reply.status(404).send({ mensagem: "PRODUTO INDISPONÍVEL :(" }); // Nenhum produto encontrado
        }
    } catch (erro: any) {
        console.error("Erro ao buscar sapato por nome e tamanho:", erro);

        // Tratamento de erros igual ao da rota /lista
        if (erro.code === 'ECONNREFUSED') {
            reply.status(400).send({ mensagem: "ERRO: LIGUE O LARAGAO => Conexão Recusada" });
        } else if (erro.code === 'ER_BAD_DB_ERROR') {
            reply.status(400).send({ mensagem: "ERRO: CRIE UM BANCO DE DADOS COM O NOME DEFINIDO NA CONEXÃO" });
        } else if (erro.code === 'ER_ACCESS_DENIED_ERROR') {
            reply.status(400).send({ mensagem: "ERRO: CONFERIR O USUÁRIO E SENHA DEFINIDOS NA CONEXÃO" });
        } else if (erro.code === 'ER_NO_SUCH_TABLE') {
            reply.status(400).send({ mensagem: "ERRO: Você deve criar a tabela com o mesmo nome da sua QUERY" });
        } else if (erro.code === 'ER_PARSE_ERROR') {
            reply.status(400).send({ mensagem: "ERRO: Você tem um erro de escrita em sua QUERY confira: VÍRGULAS, PARENTESES E NOME DE COLUNAS" });
        } else {
            reply.status(500).send({ mensagem: "Erro interno no servidor ao buscar produto." });
        }
    } finally {
        if (conn) {
            await conn.end(); // Fecha a conexão
        }
    }
});

// Inicializa o servidor na porta 8000
app.listen({ port: 8000 }, (err, address) => {
    if (err) {
        console.error("Erro ao iniciar servidor:", err);
        process.exit(1); // Encerra o processo com erro
    }
    console.log(`Servidor ouvindo em ${address}`); // Exibe no console o endereço do servidor
});
