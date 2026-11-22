PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE app_state (
  id TEXT PRIMARY KEY NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
INSERT INTO "app_state" ("id","version","data","updated_at") VALUES('main',5201,'{"classes":[{"id":"1-1","name":"1年1組","color":"#ff6b8f","members":0,"online":0,"minutes":0,"active":false},{"id":"1-2","name":"1年2組","color":"#58c9df","members":0,"online":0,"minutes":0,"active":false},{"id":"1-3","name":"1年3組","color":"#20b8a6","members":0,"online":0,"minutes":0,"active":false},{"id":"1-4","name":"1年4組","color":"#9b8af8","members":0,"online":0,"minutes":0,"active":false},{"id":"1-5","name":"1年5組","color":"#ffa85e","members":0,"online":0,"minutes":0,"active":false},{"id":"1-6","name":"1年6組","color":"#58c9df","members":0,"online":0,"minutes":0,"active":false},{"id":"1-7","name":"1年7組","color":"#20b8a6","members":0,"online":0,"minutes":0,"active":false},{"id":"1-8","name":"1年8組","color":"#9b8af8","members":0,"online":0,"minutes":0,"active":false}],"members":[],"logs":[],"adminPosts":[],"feedback":[],"usageCheck":null}',1795319431636);
