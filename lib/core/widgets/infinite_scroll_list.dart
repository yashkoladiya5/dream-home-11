import 'package:flutter/material.dart';

class InfiniteScrollList extends StatefulWidget {
  final Future<List<dynamic>> Function(int page) fetchPage;
  final Widget Function(dynamic item) itemBuilder;
  final int pageSize;
  final Widget? emptyWidget;
  final Widget? errorWidget;

  const InfiniteScrollList({
    super.key,
    required this.fetchPage,
    required this.itemBuilder,
    this.pageSize = 20,
    this.emptyWidget,
    this.errorWidget,
  });

  @override
  State<InfiniteScrollList> createState() => _InfiniteScrollListState();
}

class _InfiniteScrollListState extends State<InfiniteScrollList> {
  final _items = <dynamic>[];
  var _currentPage = 1;
  var _isLoading = false;
  var _hasMore = true;
  var _error = false;
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadPage();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      _loadPage();
    }
  }

  Future<void> _loadPage() async {
    if (_isLoading || !_hasMore) return;
    setState(() => _isLoading = true);
    try {
      final newItems = await widget.fetchPage(_currentPage);
      setState(() {
        _hasMore = newItems.length >= widget.pageSize;
        _items.addAll(newItems);
        _currentPage++;
        _error = false;
      });
    } catch (_) {
      setState(() => _error = true);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_items.isEmpty && _isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_items.isEmpty && _error) {
      return widget.errorWidget ?? const Center(child: Text('Failed to load'));
    }
    if (_items.isEmpty) {
      return widget.emptyWidget ?? const Center(child: Text('No items'));
    }
    return RefreshIndicator(
      onRefresh: () async {
        setState(() {
          _items.clear();
          _currentPage = 1;
          _hasMore = true;
        });
        await _loadPage();
      },
      child: ListView.builder(
        controller: _scrollController,
        itemCount: _items.length + (_hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index >= _items.length) {
            return const Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator()),
            );
          }
          return widget.itemBuilder(_items[index]);
        },
      ),
    );
  }
}
