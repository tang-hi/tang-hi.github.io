+++
title = "Effective cpp"
date = "2023-05-15"
categories = [
    "C++", "Book"
]
commentable = true
nofeed = true
math = true
notaxonomy = false
hidden = true
norobots = false 
nodate = false
description = "这篇文章是我对Effective Cpp的读书总结"
+++

## 1. 视C++为一个语言联邦

C++ 可以认为由`C`, `Object-Oriented C++`, `Template C++`, `STL`组成, 将他们分开看，这样子当写代码时，写到特定的领域，使用特定的写法。

## 2.尽量以const，enum，inline替代#define

使用#define定义的变量可能会宏展开，被编译器移走，从而从未进入符号表，这种情况下难以debug，而且也可能导致目标码变大，因为可能有多份数据。

1. 对于常量我们使用

```c++
const double PI = 3.14;
const char* const NAME = "Tang donghai";
const std::string NAME("Tang donghai");
```

2. 类专属的常量

```c++
class Const {
    static const int FOUR = 3; // 整数类型
   	constexpr static const char* NAME const = "NAME"; // non 整数类型, 或在实现文件中定义
}

// 如果需要取地址，需要在实现文件中加上
// const int Const::FOUR;
```

3. 一些简单的函数

```c++
#define CALL_WITH_MAX(a, b) f ((a) > (b) ? (a) : (b))

template <typename T>
inline void callWithMax(const T& a, const T& b) {
	f(a > b ? a : b);
} 
```

## 3. 尽可能使用const

如果一个变量，参数，函数不该产生变化，那么就使用const.

1. const在星号左边表示所指的内容不可变，在星号右边表示指针不变。

```c++
const int* a; // *a 不变
int* const a; // a 不变

const std::vector<int>::iterator iter;  =====> T* const // 配合typedef时尤其要注意。
std::vector<int>::const_iterator citer; =====> const T*
```

2. 如果返回值是value, 最好加上const

```c++
Rational operator+ (Rational& a, Rational& b); // bad
(a + b) = c; // ok

const Rational operator+ (Rational& a, Rational& b); // good
(a + b) = c; // wrong!
```

3. 如果成员函数不会被修改，那就应该声明为`const`,const的函数可以被重载。
4. 如果想要取得逻辑不变性，可以对成员变量声明为`mutable`，这样即使在`const`函数中依旧可以修改。
5. 当既要实现const函数，又要实现非const函数版本

```c++
class TextBook {
  public:
    const char& operator[](std::size_t position) const {
        //...
        //...
        //...
        return text[position];
    }
    
    char& operator[](std::size_t position) {
        return const_cast<char&>(static_cast<const TextBook&>(*this)[position]);
    }
};
```

## 4. 确保对象被使用前已被初始化

1. 内置类型最好手动初始化
2. 成员变量初始化顺序为它的申明顺序，可以在申明的时候初始化。
3. 不同编译单元的non-local static 不保证初始化顺序。可以将其变为local-static放到函数里面，通过调用函数保证初始化

```c++
static Global global;
||
||
||
\/
Global& getGlobal() {
    static Global global;
    return global;
}
```

## 5. 了解C++默默编写并调用哪些函数

1. 默认构造函数

   1. 如果用户没有提供
   2. 成员变量都有默认构造函数/基类有默认构造函数

2. 拷贝构造函数

   1. 如果用户没有提供
   2. 用户的基类，成员可被拷贝
   3. 用户的基类，成员有析构函数
   4. 用户并未定义提供移动构造函数，移动赋值函数。 
3. 拷贝赋值函数

   1. 如果用户没有提供
   2. 类的成员都可被拷贝赋值即没有引用类型或者const修饰的非class类型。
   3. 用户并未定义移动构造函数，移动赋值函数。
4. 移动构造函数

   1. 用户没有提供
   2. 用户未定义，拷贝构造函数，移动赋值函数，拷贝赋值函数，析构函数
   3. 非静态成员可被移动，基类可被移动，基类含有析构函数
5. 移动赋值函数

   1. 用户没有提供
   2. 用户未定义，拷贝构造函数，移动构造函数，拷贝赋值函数，析构函数
   3. 非静态成员可被移动，基类可被移动，基类含有析构函数
   4. 非静态成员没有引用类型，const类型
6. 析构函数

   1. 用户没有提供
   2. 非静态成员不可被析构。

## 6. 若不想使用编译器自动生成的函数，就该明确拒绝

明确使用`= delete;`将编译器生成的函数明确拒绝。

## 7. 为多态基类声明virtual析构函数

如果一个类有`virtual`函数，那么你需要将析构函数声明为`virtual`。否则的话，你可能造成内存泄漏，因为如果你delete `derived class`,可能不会调用子类的析构函数。

## 8.别让异常函数逃离析构函数

如果析构函数中会抛出异常，很有可能在抛出一个异常后，再析构的时候又抛出异常，这样子程序会直接结束。

如果可能抛出异常，应该将可能抛出异常的代码包装在一个函数中，由析构函数去调用它。

```c++
DBConn::~DBConn() {
    if (!closed) {
    	try {
        	db.close()
    	} catch(...) {
            
        }
    }
}

class DBConn {
    void close() {
        db.close();
        closed = true;
    }
}
```

交给用户权利去调用`close`,如果他们不去，依赖析构函数，那么析构函数吞下异常也应该是意料之中的行为。

## 9. 绝不在构造和析构过程中调用virtual函数

当你的类执行构造函数时，首先执行的是base的构造函数，而在这期间因为derived还未构造完成，因此你调用的virtual函数将会是base类的.析构函数同理。

```C++
class Base {
public:
	Base() {
		hello();    // error!!
	}
	virtual void hello();
};

class Derived {
public:
	Derived() {
		
	}
	void hello() override {
		///....
	}
};
```

## 10. 令operator= 返回一个reference to *thiss

C++世界的默认规矩
```C++
Widget& operator=(const Widget& rhs) {
	//....
	return *this;
}
```

## 11. 在operator= 中处理“自我赋值”

需要考虑是否为同一个变量
思考以下代码
```C++
Widget&
Widget::operator=(const Widget& rhs) {
	delete rhs.xxx; // bad!!!!
	pb = new XXX(*rhs.xxx);
	return *this;
}
```

需要考虑是否为同一个，可以使用以下方式
```C++
Widget&
Widget::operator=(const Widget& rhs) {
	if (this == &rhs) return *this;
	delete rhss.xxx;           // ok
	pb = new XXX(*rhs.xxx);
	return *this;
}
```

或者采用copy-swap
```C++
Widget&
Widget::operator=(const Widget& rhs) {
	Widget temp(rhs);
	swap(temp);
	return *this;
}
```

## 12. 复制对象时勿忘记其每一个成分

没什么好说的，复制时不要忘记就好！子类不要忘记父类！
```C++
class Derived{
public:
	Derive(const Derived& derived) : Base(derived), xxx(xxx) {}
	Derived& operator=(const Derived& derived) {
		//..........
		Base::operator=(derived);
		//..........
	}
};
```

## 13.  以对象管理资源

使用RAII的方式进行管理，同时注意条款8,在管理资源时别让异常逃出异构函数

## 14. 在资源管理类中小心copying行为

复制RAII对象时，必须一并复制它所管理的资源，所以资源的copying行为决定RAII对象的行为

一般而言，我们对RAII对象会采取如下方式

1. 禁止copy  mutex
2. 采用引用计数，当计数变为0时，释放资源 shared_ptr
3. 转移资源 unique_ptr

## 15. 在资源管理类中提供对原始资源的访问

一般而言，我们有两种做法

1. 显示提供get接口

   ```C++
   class A {
       data_ptr* get() const;
   };
   ```

2. 提供隐式转换接口

   ```C++
   class A {
       operator B() const;
   };
   ```

隐式转换接口，增加了误用的概率，尽管相比于显式更加自然。我更倾向于显示的接口。

## 16. 成对使用new 和 delete时要采取相同形式

被`new`出来的对象,要使用`delete`删除，被`new []`出来的对象，要使用`delete []`删除。

## 17. 以独立语句将newed对象置入智能指针

考虑以下的函数

```C++
process(std::shared_ptr(new Widget), processor());
```

对于这样的语句，编译器可以任意决定执行顺序，只要new  Widget在shared_ptr的构造函数前执行就行。

因此，我们可以以下顺序

1. new Widget
2. processor()
3. shared_ptr's ctor

如果2抛了异常，我们就面临内存泄漏的问题。

因此为了保证异常安全，我们应该以独立的语句将new对象放入智能指针。

即

```C++
auto p = std::shared_ptr(new Widget);
process(p, processor());
```

## 18. 让接口容易被正确使用，不易被误用

1. 不易被误用，这需要加许多限制(最好是编译器的限制)。
2. 接口最好与内置类型保持一致性。
3. 使用条款13, 以对象管理资源。

## 19. 设计class犹如设计type

假设你将为系统中引入一个新的type来设计class，应该如何被创建和销毁，对象的初始化和赋值有什么差别....

## 20.宁以pass-by-reference-to-const 替换 pass-by-value

这条本义是减少拷贝，但是考虑到rvo机制，也许不一定需要如此，对于内置类型，可能pass-by-value性能更好。

## 21. 必须返回对象时，别忘想返回reference

```c++
const A operator*(const A* lhs, const A* rhs) { // fine copy it
    // 
    return a;
}

//------------------------------------------
const A& operator*(const A* lhs, const A* rhs) {
    A = lhs * rhs;
    return A;           // error! dangling reference!
}
//------------------------------------------
const A& operator*(const A* lhs, const A* rhs) {
    static A a;
    a = ///...
    return a; /// error!!!!
}

auto a = a1 * a2;
auto b = a * a2;
a == b // true!
```

## 22. 将成员变量声明为private

将成员声明为private，从而保证了封装以及日后随时修改的权利

> 封装性是当你删去该代码时，所影响的代码量。

以这个评判角度来看，public(所有使用的代码)和protected（所有继承的代码）有着一样的封装性

因此尽可能将成员变量声明为private

## 23. 宁以non-member non-friend 替换member函数

和条款22一样，当我们采用member函数/friend函数，意味着我们增加了一个函数可以访问private的成员变量，这就意味着我们的代码封装性下降了（更多的代码可以访问private成员了）。

因此如果可以的话，使用non-member non-friend替换member函数，同时将同一个类的non-member函数分类存放在不同的头文件中。减少编译依赖。



如果想将一个member函数转化为非member函数，不要先考虑变为friend函数，因为这两个封装性一致。要考虑转化为non-member函数。

## 24. 若所有参数皆需类型转换，请为此采用non-member函数。

考虑一个乘法

```C++
const Rational operator*(const Rational& lhs, const Rational& rhs); // 1


const Rational operator*(const Rational& rhs); // 2
```

1 比 2好，因为两种参数都可以进行隐式转换。

## 25. 考虑出写出一个不抛异常的swap函数。

首先swap函数不应当抛出异常，因为如果你想要写出异常安全的代码，很大程度上你要依赖swap函数，因此不要写出会抛出异常的代码

怎么自定义高效的swap函数？

```C++
template<typename T>
class Efficient {
public:
    void swap(Efficient& a) noexcept {
        // efficient
    }
    
    
};

template <typename T>
void swap(Efficient<T>& lhs, Efficient<T>& rhs) {
    lhs.swap(rhs);
}

namespace std {
    template<>
    void swap<Widget>(Widget& lhs, Widget& rhs) {
        
    }
}
```

自定义高效的swap函数

1. 定义public的成员函数，实现具体逻辑
2. 定义non-member的模板函数，调用成员函数。
3. 如果你定义的不是class template，而是class，可以全特化std中的swap。

## 26. 尽可能延后变量定义式的出现时间

尽可能仅在必要时定义你所需要的变量，尤其是class具有constructor的成本，防止无意义的构造成本。

## 27. 尽量少做转型动作

尽量少做转型动作，这并不是没有代价的，很有可能会产生对应的汇编代码。

如果转型也尽量使用新式的转型`static_cast` `dynamic_cast`....

## 28. 避免返回handles指向对象内部成分

避免将内部private的函数通过引用，指针等方式泄露出去，有时我们必须这么干，如果不想用户可以更改它，将返回值加上const的限制。并且保证handle的生命周期一直有效。

## 29. 为"异常安全"而努力是值得的

 时刻保证即使抛出异常，各成员，class也处于有效的合法的状态（基本保证）

强烈保证（要么调用前，要么成功）

使用智能指针控制new的内存，copy and swap机制来保证。

## 30. 透彻了解inlining的里里外外

仅将inline加在短小的函数中，被频繁调用的函数。

## 31. 将文件间的编译依存关系降至最低

现在还没什么体会。

## 32. 确定你的public继承塑模出is-a关系

适用于base class身上的每一件事情一定也适用于derived class身上，因为每一个derived class对象也都是一个base class对象。这个可能需要后面的体会。

## 33. 避免遮掩继承而来的名称

如果你有一个base class

```c++
class Base {
 public:
    void mf1();
    void mf1(int x);
    void mf1(int x, int y);
};
```

你想写一个`derived`class，并且重新override一部分函数

```c++
class Derived : public Base{
  public:
    void mf1();
};
```

但是这样就掩盖了Base class的其他mf1的函数了，如果你仍然想要使用Base class的mf1函数，那么使用`using`

```c++
class Derived : public Base {
  public:
    using Base::mf1;         // use this!!
    void mf1();
};
```

但是如果你只想继承部分的基类函数(例如private 继承)，那么你需要使用forward function

```c++
class Derived : private Base {
    void mf1() {           // 名称掩盖
        Base::mf1();      // 内部使用Base
    }
};
```

## 34. 区分接口继承和实现继承

继承分为继承`成员函数的接口`以及`成员函数的实现`

1. 当你声明一个函数为`pure virtual`,说明你只希望他们继承接口，而不是实现。

2. 当你声明一个函数为`virtual`，说明你希望他们继承接口，同时提供一份默认实现。
3. 当你将一个函数声明为`non virtual`时，说明你希望他们继承接口，但是接受一个强制的实现。

但是有时候，我们会担心后续开发者，忘记修改默认的`virtual`.

```c++
class Airplane {
public:
    virtual void fly() = 0;
protected:
    void defaultFly();
};
```

缺省实现放在defaultFly函数中，同时将fly设置为pure virtual,这样就可以防止后续开发者忘记实现`fly`

## 35.考虑virtual函数以外的其他选择

`virtual`函数的一些替换方案是

1. 使用函数指针，由调用者决定不同的表现形式
2. 使用NVI，即public的`non-virtual`函数，调用private 的 `virtual`函数。

## 36.绝不重新定义继承而来的non-virtual函数

不要定义继承而来的non-virtual函数，第一这违反oop原则，其次调用者可能会错误使用，例如

```C++
class Base {
    void mf1();
};


class Derived : public Base{
    
};

D x;
B* b = &x;
D* d = &d;
b->mf1(); // diff if you derived
d->mf1();
```

## 37. 绝不重新定义继承而来的缺省参数值

因为参数缺省定义是静态绑定的，这个和`virtual`函数相反，`virtual`函数是动态的绑定的。因此如果你重新定义继承而来的缺省参数，从而导致一个错误的情况。

```c++
class Base {
    virtual void hello(int a = 1);
};

class Derived {
    virtual void hello(int a = 2);  // ooooops! 
}；

```

## 38. 通过复合塑造出has-a 或"根据某物实现出"

继承是is-a关系，而复合是has-a，你并不一定需要继承它的接口，那么你可以使用复合的方式在内部将该对象设置为成员变量，通过该对象的调用完成。

## 39. 明智而审慎的使用private继承

private继承意味着并不会在引用时自动转换，同时所有继承而来的成员变量以及函数都是private类型的。

这意味着你并不想继承函数定义，你只是想要它的部分实现，这很类似于复合的方式。

但是选取private而不是复合的原因是因为涉及到`virtual`函数以及部分protected的成员变量。

当没有更好的办法时，private是个好方法。

## 40.明智而审慎的使用多重继承

使用多重继承，会非常复杂，而且更可能增加名称冲突的概率，而如果是菱形继承那么，你可能需要virtual继承消除多个成员变量的重复值。

而你最应该的使用的使用public继承接口，然后用private继承继承实现部分。

## 41. 了解隐式接口和编译器多态

`class`和`template`都支持接口和多态。对`class`而言接口是显式的，而且多态要通过virtual来保证。

而`template`则是隐式的，而且编译期就可以实现多态

## 42. 了解typename的双重意义

1. 用于在template指定模板形参。
2. 用于指定类内一些嵌套的类型名称。

## 43. 学习处理模板化基类内的名称

如果我们继承一个模板类，我们想要调用基类继承而来的成员函数，可能会遇到麻烦

假设以下的代码

```c++
template<typename T>
class Base {
public:
   void hello();  
};

template<typename T>
class Derived : public Base<T> {
public:
    void hello2() {
        hello();   // error! couldn't find it!
    }
};
```

之所以会出现这样的原因是，编译器不确定你是不是会全特化`Base`class，全特化可能不实现成员函数了。因此，他对你继承的`template class`不会做任何假设。比如

```c++
template<>
class Base<int> {
    public:
    void yes();
}
```

这样就没有hello函数了，对此我们可以有以下三种方式解决

```c++
template<typename T>
class Derived : public Base<T> {
    public:
    void hello2() {
        this->hello();     // 假设hello可以被调用
    }
};

template<typename T>
class Derived : public Base<T> {
    public:
    using Base<T>::hello; // 告诉编译器，可以从Base中寻找该定义。揭露出命名。
    void hello2() {
        hello();     
    }
};

template<typename T>
class Derived : public Base<T> {
    public:
    
    void hello2() {
        Base<T>::hello();      // 指定hello的应用，但是这样子就会丧失多态性，因为不是用this调用的
    }
};
```

## 44. 将于参数无关的代码抽离template

如果`template`与参数无关，那么我们应该抽离，考虑如下函数

```c++
template<typename T, size_t n>
class Base {
    
};
```

对这种代码，不同的n会生成不同的模板代码，因此我们需要将n与T分割开

```C++
template<typename T, size_t n>
class BaseV2 : public BaseV1<T> {
    
};
```

## 45.运用成员函数模板接受所有兼容类型

考虑shared_ptr,我们希望可以通过`shared_ptr<Bottom>`初始化构造`shared_ptr<Up>`，但是如果我们这样子写的话

```c++
template<typename T>
class shared_ptr {
  shared_ptr(const shared_ptr<T>& other);  
};
```

这样只能够`shared_ptr<Up>`初始化构造`shared_ptr<Up>`

所以我们使用范化的构造函数

```c++
template<typename T>
class shared_ptr {
    template<typename U>
    shared_ptr(const shared_ptr<U>& other);
}
```

这样子我们得到了很多的构造函数，超过了我们的要求，甚至可以用`shared_ptr<double>`初始化构造`shared_ptr<Up>`,为了对此加以限制。

```c++
template<typename T>
class shared_ptr {
    template<typename U>
    shared_ptr(const shared_ptr<U>& other) : 
    data(other.get()) // add some restriction
    {}
    
    T* get();
    T* data;
};
```

通过上述手法加以限制后，我们可以确定只有U可以隐式的转化为T时，我们才可以做成这样的事情。

注意我们这里并没有加上explicit，因为指针的隐式转化是被允许的，因此shared_ptr也被允许隐式转化。



同时注意泛化的成员模板函数，并不会对原来的生成规则产生影响，你可以将其视为一个普通的成员函数，而不是特殊的构造函数。

## 46. 需要类型转换时请为模板定义非成员函数

 考虑以下代码

```c++
template<typename T>
class NumberType {
	NumberType(T val); 
};	

template<typename T>
const NumberType<T> operator*(const NumberType<T>& lhs, const NumberType<T>& rhs) {
    //....
} 
```

如果我们调用

```C++
NumberType<int> a;
a * 3;
```

这样是不会调用成功的，第二个参数也无法隐式转化。因为C++会先进行template推倒，再实例化，因此你需要将其声明为friend并提供定义

```c++
template<typename T>
class NumberType {
	NumberType(T val);
    friend
    const NumberType<T> operator*(const NumberType<T>& lhs, const NumberType<T>& rhs) {
    //....
	}     
};	
```

这样子在你声明`NumberType<int>`时，就会实例化该friend函数，在你调用时就可以直接引进类型转化了。

## 47. 请使用traits classes表明类型信息

即类内根据std的规则`typedef`一定的东西

## 48. 认识template元编程

nothing to say

## 49. 了解new-handler的行为

new-handler可以让你在内存无法分配至，指定一个函数，让其被调用。

## 50. 了解new 和 delete的合理替换时机

当你需要log，检查bug，测试性能等原因时，可以自定义new delete

## 51. 编写new和delete时要固守常规

例如，当用户需要new 0 byte时，需要返回1byte，或者如果无法分配内存就需要调用new handler等

## 52. 写了placement new 也要写placement delete

placement new是指定一个地方调用构造函数，new这个操作符

1. 调用operator new 申请内存
2. 指定位置上调用构造函数

## 53. 不要轻忽编译器的警告

## 54. 让自己熟悉标准库

## 55. 让自己熟悉Boost
