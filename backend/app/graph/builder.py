from typing import Dict, Any, Callable
from langgraph.graph import StateGraph, END
from app.graph.state import AgentState

# Import nodes
from app.graph.nodes.ingest import node_ingest
from app.graph.nodes.align import node_align
from app.graph.nodes.audit import node_audit
from app.graph.nodes.reconcile import node_reconcile
from app.graph.nodes.plan import node_plan
from app.graph.nodes.execute import node_execute
from app.graph.nodes.verify import node_verify
from app.graph.nodes.critic import node_critic
from app.graph.nodes.compose import node_compose
from app.graph.nodes.number_guard import node_number_guard
from app.graph.nodes.report import node_report

NODE_SEQUENCE = [
    ("ingest", node_ingest),
    ("align", node_align),
    ("audit", node_audit),
    ("reconcile", node_reconcile),
    ("plan", node_plan),
    ("execute", node_execute),
    ("verify", node_verify),
    ("critic", node_critic),
    ("compose", node_compose),
    ("number_guard", node_number_guard),
    ("report", node_report),
]

def build_graph():
    builder = StateGraph(AgentState)

    for name, fn in NODE_SEQUENCE:
        builder.add_node(name, fn)

    builder.set_entry_point("ingest")

    # Linear workflow sequence
    for i in range(len(NODE_SEQUENCE) - 1):
        builder.add_edge(NODE_SEQUENCE[i][0], NODE_SEQUENCE[i + 1][0])

    builder.add_edge("report", END)

    return builder.compile()

# Global compiled graph
agent_graph = build_graph()
