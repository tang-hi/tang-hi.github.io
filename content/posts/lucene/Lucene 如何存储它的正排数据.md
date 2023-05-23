---
title: "Lucene 如何存储它的正排索引"
date: 2023-05-23
math: true
---


本文将介绍Lucene9.6如何存储它的正排索引，以帮助读者更好地理解其内部工作原理。

正排索引，也被称为前向索引，是信息检索系统中的一种基本数据结构。它按照文档的顺序存储每个文档的内容和属性，使得系统能够快速地获取到任何指定文档的详细信息。在Lucene中，正排数据的存储机制是其能够高效执行全文搜索的关键因素之一。

因为本文的主要关注点是正排索引在磁盘中的存储格式，因此对于文档的预处理以及`docID`是如何获得会进行忽略。

## 什么是正排索引

简单来说，正排索引就是可以通过`docID` 查询到对应的文档。我们可以将其类比为KV，`docID`为Key，文档内容为Value。

<div style="text-align: center">
<img src="/pic/lucene-forward/doc-first.png"/>
</div>

因此Lucene的正排索引在磁盘中的layout必须可以通过`docID`快速定位到文档的内容。

## 正排索引的构建

正排索引构建的入口函数`IndexingChain#processDocument` （Lucene中将正排索引称为StoredFields）

````java
 void processDocument(int docID, Iterable<? extends IndexableField> document) throws IOException {
   	
    startStoredFields(docID);
    try {
	  // skip .....
      docFieldIdx = 0;
      for (IndexableField field : document) {
        if (processField(docID, field, docFields[docFieldIdx])) {
          fields[indexedFieldCount] = docFields[docFieldIdx];
          indexedFieldCount++;
        }
        docFieldIdx++;
      }
    } finally {
      if (hasHitAbortingException == false) {
      	// skip ...
        // finish forward index
        finishStoredFields();
        
        // skip ...
      }
    }
  }
````

我们如果只关注正排索引的处理，会发现Lucene对于正排索引一共会做三件事

1. 根据`docID`进行初始化。
2. 对文档中的每一个字段进行处理。
3. 对这篇doc中的正排索引进行收尾操作。

如果只是关注索引是如何存储在磁盘中的话，我们只需要关注后两件事。

````java
private boolean processField(int docID, IndexableField field, PerField pf) throws IOException {
    // skip....
    
    // Add stored fields
    if (fieldType.stored()) {
      StoredValue storedValue = field.storedValue();
      if (storedValue == null) {
        throw new IllegalArgumentException("Cannot store a null value");
      } else if (storedValue.getType() == StoredValue.Type.STRING
          && storedValue.getStringValue().length() > IndexWriter.MAX_STORED_STRING_LENGTH) {
        throw new IllegalArgumentException(
            "stored field \""
                + field.name()
                + "\" is too large ("
                + storedValue.getStringValue().length()
                + " characters) to store");
      }
      try {
        storedFieldsConsumer.writeField(pf.fieldInfo, storedValue);
      } catch (Throwable th) {
        onAbortingException(th);
        throw th;
      }
    }

    // skip...
  }

void writeField(FieldInfo info, StoredValue value) throws IOException {
    switch (value.getType()) {
      case INTEGER -> writer.writeField(info, value.getIntValue());
      case LONG -> writer.writeField(info, value.getLongValue());
      case FLOAT -> writer.writeField(info, value.getFloatValue());
      case DOUBLE -> writer.writeField(info, value.getDoubleValue());
      case BINARY -> writer.writeField(info, value.getBinaryValue());
      case STRING -> writer.writeField(info, value.getStringValue());
      default -> throw new AssertionError();
    }
  }
````

我们可以发现在处理正排索引时，我们使用`writeField`对文档中的每一个字段进行处理。

我们看一下对于定长以及变长的字段，Lucene分别是如何处理的。

````java
  @Override
  public void writeField(FieldInfo info, double value) throws IOException {
    ++numStoredFieldsInDoc;
    final long infoAndBits = (((long) info.number) << TYPE_BITS) | NUMERIC_DOUBLE;
    bufferedDocs.writeVLong(infoAndBits);
    writeZDouble(bufferedDocs, value);
  }

  @Override
  public void writeField(FieldInfo info, BytesRef value) throws IOException {
    ++numStoredFieldsInDoc;
    final long infoAndBits = (((long) info.number) << TYPE_BITS) | BYTE_ARR;
    bufferedDocs.writeVLong(infoAndBits);
    bufferedDocs.writeVInt(value.length);
    bufferedDocs.writeBytes(value.bytes, value.offset, value.length);
  }
````

相同点是每写一个字段，都会`numStoredFieldsInDoc++`，这个变量很好理解，记录这篇文档中存储了多少个字段。随后会向`bufferedDocs`（可以认为是一个内存数组）添加这个字段的相关信息。

字段的相关信息我们可以认为有三种

1. 字段的编号(每个字段都有一个独一无二的编号)
2. 字段的数据类型
3. 字段的数据，即该字段的值。

因为字段的数据类型只是有限的几种，因此Lucene会将其与字段的编号一起存储为一个long类型

````java
final long infoAndBits = (((long) info.number) << TYPE_BITS) | NUMERIC_DOUBLE;
````

而当字段为定长时，我们会直接将其写入`bufferedDocs`。但是当字段为变长时，我们会先将该值所占的bytes数写入`bufferedDocs`后，再将该值写入`bufferedDocs`。因此我们可以认为`bufferedDocs`的数据格式为



<div style="text-align: center">
<img src="/pic/lucene-forward/bufferedDocs.png"/>
</div>

当处理完每篇文档的字段后，我们可以认为我们已经将这篇文档buffer在了内存中，而后我们需要做的就是对正排索引进行收尾工作，即将其flush到磁盘中。

