![alt tag](https://github.com/andresoviedo/ascii-editor/blob/master/ascii-editor.png?raw=true)

ASCII Editor
============

The basic idea of this project is to have an editor to design schemas, tables, drawings, etc. for making technical documentation that can be
used into the ubiquitous README files.

There is already some tools in internet like the awesome asciiflow, but I need something more professional and the asciiflow tool is not open source;
so I have decided to cook my own stuff and share it with the world :)


Try it!
=======

* http://www.andresoviedo.org/ascii-editor


Example
=======

This is an example of what you can draw with the app

                                                                                                                                                                                                        
      +-----------------------+                 ┌───────────────────────┐                                                                                                                               
      |                       |                 │                       │                                                                                                                               
      |      BOX STYLE 1      |    connector    │     BOX STYLE 2       │                                                                                                                               
      |                       +-----------------+                       │                                                                                                                               
      |                       |                 │                       │                                                                                                                               
      +-----------------------+                 └───────────────────────┘                                                                                                                               
                                                                                                                                                                                                        

News (27/04/2016)
=================

- Working on connectors...


Design
======

- HTML canvas technology
- JavaScript ECMAScript6 technology (Classes & Proxies)
- Object oriented design. Classes, Inheritance,
- Patters design: Layers Pattern, Decorator Pattern, Proxy Pattern
- JQuery framework (just for manipulating DOM)


Features implemented
====================

- Canvas controller (mouse click, mouse wheel, mouse drag, key down, key press, key up)
- Canvas grid (100 x 200)
- Scrollable canvas (mouse wheel)
- Zoomable canvas (shift + mouse wheel)
- Movable canvas (shift + mouse drag)
- Resizable canvas (on windows resize)
- Canvas cursor & pointer (arrow keys can control the cursor)
- Write chars
- Draw with different line styles
- HTML Storage support to resume work
- Tools:
 - Add / Edit text
 - Draw / Resize boxes (move lines also)
 - Select Area / Clear / Move it
 - Select Box / Move it
 - Clear canvas
 - Export to ASCII (so you can copy / paste)


Still to be implement (in order of priority)
============================================

- import ASCII
- cut / copy / paste
- trim to export (remove unnecessary lines, columns)
- export indented (so it can be copied then to README.md files - should start with 4 spaces)
- implement box connectors (lines, arrows)
- make size of canvas configurable / resizable
- undo / redo


Nice to have
============

- text behaviour: handle return key when writing chars
- text behaviour: resize shape if writing text inside
- save / restore configuration (zoom for example)
- implement tables (add columns, add rows)
- select shape / move shape (not just boxes, but tables)
- implement chars library (choose char from unicode list)
- integrate ASCII library
- improve / beautify UI
- fix state machine for all tools (like I did in SelectTool)
- handle keyboard functions: printing F2 / handle find F3 / handle full screen F11
- many more...


Alternatives
============

* ascii-flow: http://asciiflow.com/
* sixteencolors: http://draw.sixteencolors.net
* ascii-tables: https://ozh.github.io/ascii-tables/


Testing
=======

* Tested in Chrome Linux 50.0.2661.75 beta (64-bit)


Final Notes
===========

You are free to use this program while you keep this file and the authoring comments in the code. Any comments, suggestions or contributions are welcome.


Contact Information
===================

http://www.andresoviedo.org
