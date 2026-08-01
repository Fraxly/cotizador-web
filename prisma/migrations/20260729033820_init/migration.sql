-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "atencion" TEXT NOT NULL,
    "emitido" TEXT NOT NULL,
    "fechaCorta" TEXT NOT NULL,
    "anio" TEXT NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'PEN',
    "intro" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "detalle" TEXT NOT NULL,
    "tiempoProd" TEXT,
    "condiciones" TEXT NOT NULL,
    "transferencia" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_numero_key" ON "Quote"("numero");
